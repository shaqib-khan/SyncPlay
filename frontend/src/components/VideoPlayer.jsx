import { useEffect, useRef, useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { Loader2, AlertCircle, RefreshCw, Film, Sparkles, Volume2 } from 'lucide-react'

/**
 * VideoPlayer – YouTube IFrame Player with reliable real-time synchronization.
 *
 * Key design decisions:
 * - Player commands (play, pause, seek, loadVideo) are executed via imperative handle
 *   refs — NOT driven by React state changes — so there's no stale closure or render delay.
 * - isRemoteSyncRef gates onStateChange to prevent the participant's player from
 *   echoing back a "play" event as if the participant triggered it.
 * - Drift correction on sync_state: only corrects if drift > 1.5s to avoid micro-stutter.
 * - Browser autoplay policy: attempts unmuted, falls back to muted, shows unlock pill.
 */
const VideoPlayer = forwardRef(({
  videoId,
  syncState,       // { playState, currentTime, stateVersion, receivedAt } — for initial load sync
  onReady,
  onDurationChange,
  onTimeUpdate,
  onEnded,
  onOpenSearch,
  authorized = false,
  theaterMode = false,
  onToggleTheater,
  playerWrapperRef,
  playerInstanceRef,
  onDirectPlay,
  onDirectPause,
  onDirectSeek,
  isRemoteSyncRef,
}, ref) => {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const syncRef = useRef(syncState)
  const timeUpdateInterval = useRef(null)
  const [playerState, setPlayerState] = useState('loading') // loading | ready | error
  const [playerError, setPlayerError] = useState(null)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const currentVideoIdRef = useRef(videoId)
  const lastKnownTimeRef = useRef(0)
  const lastStateRef = useRef(-1)
  const playerReadyRef = useRef(false)
  const pendingCommandRef = useRef(null) // { type, time, videoId }
  const authorizedRef = useRef(authorized)

  syncRef.current = syncState
  authorizedRef.current = authorized

  // ─── Imperative API exposed to WatchRoom ──────────────────────────────────
  // WatchRoom calls these directly on socket events instead of routing through state.
  useImperativeHandle(ref, () => ({
    play: (targetTime) => {
      if (!playerReadyRef.current || !playerRef.current) {
        pendingCommandRef.current = { type: 'play', time: targetTime }
        return
      }
      executePlay(targetTime)
    },
    pause: (targetTime) => {
      if (!playerReadyRef.current || !playerRef.current) {
        pendingCommandRef.current = { type: 'pause', time: targetTime }
        return
      }
      executePause(targetTime)
    },
    seek: (targetTime) => {
      if (!playerReadyRef.current || !playerRef.current) {
        pendingCommandRef.current = { type: 'seek', time: targetTime }
        return
      }
      executeSeek(targetTime)
    },
    loadVideo: (newVideoId, startTime = 0) => {
      if (!playerReadyRef.current || !playerRef.current) {
        pendingCommandRef.current = { type: 'loadVideo', videoId: newVideoId, time: startTime }
        return
      }
      executeLoadVideo(newVideoId, startTime)
    },
    applySyncState: (state) => {
      if (!playerReadyRef.current || !playerRef.current) {
        // Queue for when player becomes ready
        pendingCommandRef.current = { type: 'applySync', state }
        return
      }
      applySync(state)
    },
    getCurrentTime: () => {
      try { return playerRef.current?.getCurrentTime?.() || 0 } catch { return 0 }
    },
    getPlayerState: () => {
      try { return playerRef.current?.getPlayerState?.() } catch { return -1 }
    },
  }))

  // ─── Core Command Executors (always use live playerRef) ───────────────────

  const executePlay = useCallback((targetTime) => {
    const player = playerRef.current
    if (!player) return
    try {
      const startedAt = Date.now()
      if (isRemoteSyncRef) isRemoteSyncRef.current = true
      if (typeof targetTime === 'number' && !isNaN(targetTime)) {
        const cur = player.getCurrentTime?.() || 0
        if (Math.abs(cur - targetTime) > 0.25) {
          player.seekTo(targetTime, true)
        }
      }
      player.playVideo()
      // Autoplay policy fallback
      setTimeout(() => {
        try {
          const state = player.getPlayerState?.()
          if (state !== 1 && state !== 3) {
            player.mute()
            player.playVideo()
            setAutoplayBlocked(true)
          }
        } catch {}
        if (isRemoteSyncRef) isRemoteSyncRef.current = false
      }, 450)

      // Post-buffer micro-alignment at 700ms and 1500ms to eliminate YouTube startup lag
      if (typeof targetTime === 'number' && !isNaN(targetTime)) {
        const alignIfDrifted = () => {
          try {
            if (player.getPlayerState?.() === 1) {
              const expected = targetTime + (Date.now() - startedAt) / 1000
              const actual = player.getCurrentTime?.() || 0
              if (Math.abs(actual - expected) > 0.25) {
                if (isRemoteSyncRef) isRemoteSyncRef.current = true
                player.seekTo(expected, true)
                setTimeout(() => {
                  if (isRemoteSyncRef) isRemoteSyncRef.current = false
                }, 250)
              }
            }
          } catch {}
        }
        setTimeout(alignIfDrifted, 700)
        setTimeout(alignIfDrifted, 1500)
      }
    } catch (e) {
      console.warn('[VideoPlayer] play command error:', e)
      if (isRemoteSyncRef) isRemoteSyncRef.current = false
    }
  }, [isRemoteSyncRef])

  const executePause = useCallback((targetTime) => {
    const player = playerRef.current
    if (!player) return
    try {
      if (isRemoteSyncRef) isRemoteSyncRef.current = true
      player.pauseVideo()
      if (typeof targetTime === 'number' && !isNaN(targetTime)) {
        const cur = player.getCurrentTime?.() || 0
        if (Math.abs(cur - targetTime) > 0.3) {
          player.seekTo(targetTime, true)
        }
      }
      setTimeout(() => {
        if (isRemoteSyncRef) isRemoteSyncRef.current = false
      }, 500)
    } catch (e) {
      console.warn('[VideoPlayer] pause command error:', e)
      if (isRemoteSyncRef) isRemoteSyncRef.current = false
    }
  }, [isRemoteSyncRef])

  const executeSeek = useCallback((targetTime) => {
    const player = playerRef.current
    if (!player || typeof targetTime !== 'number' || isNaN(targetTime)) return
    try {
      if (isRemoteSyncRef) isRemoteSyncRef.current = true
      player.seekTo(targetTime, true)
      setTimeout(() => {
        if (isRemoteSyncRef) isRemoteSyncRef.current = false
      }, 500)
    } catch (e) {
      console.warn('[VideoPlayer] seek command error:', e)
      if (isRemoteSyncRef) isRemoteSyncRef.current = false
    }
  }, [isRemoteSyncRef])

  const executeLoadVideo = useCallback((newVideoId, startTime = 0) => {
    const player = playerRef.current
    if (!player || !newVideoId) return
    try {
      if (isRemoteSyncRef) isRemoteSyncRef.current = true
      currentVideoIdRef.current = newVideoId
      player.loadVideoById({ videoId: newVideoId, startSeconds: startTime || 0 })
      // loadVideoById auto-plays; ensure it actually starts
      setTimeout(() => {
        try {
          const state = player.getPlayerState?.()
          if (state !== 1 && state !== 3) {
            player.mute()
            player.playVideo()
            setAutoplayBlocked(true)
          }
          if (isRemoteSyncRef) isRemoteSyncRef.current = false
        } catch {}
      }, 800)
    } catch (e) {
      console.warn('[VideoPlayer] loadVideo command error:', e)
      if (isRemoteSyncRef) isRemoteSyncRef.current = false
    }
  }, [isRemoteSyncRef])

  // ─── Full sync state application (for late joiners & reconnects) ──────────
  const applySync = useCallback((state) => {
    const player = playerRef.current
    if (!state || !player?.seekTo) return
    try {
      if (isRemoteSyncRef) isRemoteSyncRef.current = true

      // ── Video ID mismatch: load the correct video first ──
      // This is the primary cause of participants seeing a different video.
      if (state.videoId && state.videoId !== currentVideoIdRef.current) {
        currentVideoIdRef.current = state.videoId
        const startAt = typeof state.currentTime === 'number' && !isNaN(state.currentTime)
          ? Math.max(0, state.currentTime) : 0
        player.loadVideoById({ videoId: state.videoId, startSeconds: startAt })
        // loadVideoById auto-plays; if host was paused, pause after load
        if (state.playState === 'paused') {
          setTimeout(() => {
            try { player.pauseVideo() } catch {}
            if (isRemoteSyncRef) isRemoteSyncRef.current = false
          }, 1200)
        } else {
          setTimeout(() => {
            try {
              const code = player.getPlayerState?.()
              if (code !== 1 && code !== 3) { player.mute(); player.playVideo(); setAutoplayBlocked(true) }
            } catch {}
            if (isRemoteSyncRef) isRemoteSyncRef.current = false
          }, 800)
        }
        return
      }

      const stateTime = typeof state.currentTime === 'number' && !isNaN(state.currentTime)
        ? state.currentTime : 0
      const elapsed = state.playState === 'playing' && state.receivedAt
        ? (Date.now() - state.receivedAt) / 1000 : 0
      const targetTime = Math.max(0, stateTime + elapsed)
      const currentPos = player.getCurrentTime?.() || 0
      const drift = Math.abs(currentPos - targetTime)

      if (state.playState === 'playing') {
        if (drift > 0.5) {
          player.seekTo(targetTime, true)
          lastKnownTimeRef.current = targetTime
        }
        const pState = player.getPlayerState?.()
        if (pState !== 1 && pState !== 3) {
          player.playVideo()
          setTimeout(() => {
            try {
              const code = player.getPlayerState?.()
              if (code !== 1 && code !== 3) {
                player.mute()
                player.playVideo()
                setAutoplayBlocked(true)
              }
              if (isRemoteSyncRef) isRemoteSyncRef.current = false
            } catch {}
          }, 500)
          return
        }
      } else if (state.playState === 'paused') {
        player.pauseVideo()
        if (drift > 0.5) {
          player.seekTo(stateTime, true)
          lastKnownTimeRef.current = stateTime
        }
      }
    } catch (e) {
      console.warn('[VideoPlayer] applySync error:', e)
    } finally {
      setTimeout(() => {
        if (isRemoteSyncRef) isRemoteSyncRef.current = false
      }, 600)
    }
  }, [isRemoteSyncRef])

  // ─── Player Initialization ────────────────────────────────────────────────
  const initPlayer = useCallback(() => {
    if (!videoId) { setPlayerState('ready'); return }
    if (!containerRef.current || !window.YT?.Player) return
    if (playerRef.current) return

    try {
      containerRef.current.innerHTML = ''
      const mountNode = document.createElement('div')
      containerRef.current.appendChild(mountNode)

      playerRef.current = new window.YT.Player(mountNode, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          autoplay: 0,
          controls: authorizedRef.current ? 1 : 0,
          disablekb: authorizedRef.current ? 0 : 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            playerReadyRef.current = true
            // Track which video the player actually loaded
            currentVideoIdRef.current = videoId
            setPlayerState('ready')
            const duration = event.target.getDuration?.() || 0
            onDurationChange?.(duration)
            onReady?.(playerRef.current)
            if (playerInstanceRef) playerInstanceRef.current = playerRef.current

            // Apply any pending command that arrived before player was ready
            if (pendingCommandRef.current) {
              const cmd = pendingCommandRef.current
              pendingCommandRef.current = null
              setTimeout(() => {
                if (cmd.type === 'play') executePlay(cmd.time)
                else if (cmd.type === 'pause') executePause(cmd.time)
                else if (cmd.type === 'seek') executeSeek(cmd.time)
                else if (cmd.type === 'loadVideo') executeLoadVideo(cmd.videoId, cmd.time)
                else if (cmd.type === 'applySync') applySync(cmd.state)
                else applySync(syncRef.current)
              }, 300)
            } else if (syncRef.current) {
              // Initial state sync for late joiners
              setTimeout(() => applySync(syncRef.current), 300)
            }

            // Periodic time + duration polling
            if (timeUpdateInterval.current) clearInterval(timeUpdateInterval.current)
            timeUpdateInterval.current = setInterval(() => {
              if (!playerRef.current) return
              try {
                const t = playerRef.current.getCurrentTime?.()
                if (typeof t === 'number' && !isNaN(t)) {
                  onTimeUpdate?.(t)
                  // Detect native scrubber usage by authorized users
                  if (authorizedRef.current && !isRemoteSyncRef?.current && lastKnownTimeRef.current > 0) {
                    const expected = lastStateRef.current === 1
                      ? lastKnownTimeRef.current + 0.45
                      : lastKnownTimeRef.current
                    if (Math.abs(t - expected) > 2.0) {
                      onDirectSeek?.(t)
                    }
                  }
                  lastKnownTimeRef.current = t
                }
                const d = playerRef.current.getDuration?.()
                if (d && typeof d === 'number' && !isNaN(d) && d > 0) onDurationChange?.(d)
              } catch {}
            }, 400)
          },

          onStateChange: (event) => {
            const stateCode = event.data
            // 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
            if (stateCode === 0) { onEnded?.(); return }

            const player = playerRef.current
            const curTime = typeof player?.getCurrentTime === 'function'
              ? player.getCurrentTime() : 0

            // Skip echoing back remote sync commands
            if (isRemoteSyncRef?.current) {
              lastKnownTimeRef.current = curTime
              lastStateRef.current = stateCode
              return
            }

            // Only Host/Mod broadcasts their own native player actions;
            // non-authorized participants cannot locally play/pause out of sync
            if (authorizedRef.current) {
              const timeDiff = Math.abs(curTime - lastKnownTimeRef.current)
              if (timeDiff > 1.5 && lastKnownTimeRef.current > 0) {
                onDirectSeek?.(curTime)
              }
              if (stateCode === 1) {
                setAutoplayBlocked(false)
                onDirectPlay?.(curTime)
              } else if (stateCode === 2) {
                onDirectPause?.(curTime)
              }
            } else if ((stateCode === 1 || stateCode === 2) && syncRef.current) {
              // Enforce host's authoritative state if participant somehow triggered play/pause
              const authState = syncRef.current.playState
              if ((stateCode === 1 && authState === 'paused') || (stateCode === 2 && authState === 'playing')) {
                setTimeout(() => applySync(syncRef.current), 50)
              }
            }

            lastKnownTimeRef.current = curTime
            lastStateRef.current = stateCode
          },

          onError: (event) => {
            console.error('[VideoPlayer] YouTube error code:', event.data)
            const messages = {
              2: 'Invalid YouTube video ID.',
              5: 'HTML5 player error.',
              100: 'Video not found or removed.',
              101: 'Embedding disabled by video owner.',
              150: 'Embedding disabled by video owner.',
            }
            setPlayerError(messages[event.data] || 'Video playback error.')
            setPlayerState('error')
          },
        },
      })
    } catch (e) {
      console.error('[VideoPlayer] Failed to initialize player:', e)
      setPlayerError('Could not initialize video player.')
      setPlayerState('error')
    }
  }, [videoId, onDurationChange, onReady, onTimeUpdate, onEnded, playerInstanceRef,
      authorized, onDirectPlay, onDirectPause, onDirectSeek, isRemoteSyncRef,
      executePlay, executePause, executeSeek, executeLoadVideo, applySync])

  // ─── Load YouTube IFrame API once ────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) { initPlayer(); return }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }

    const prevReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prevReady === 'function') prevReady()
      initPlayer()
    }
  }, [initPlayer])

  // ─── Handle videoId prop change (new video selected via queue/host) ───────
  useEffect(() => {
    if (!videoId || !playerReadyRef.current) return
    if (currentVideoIdRef.current === videoId) return
    // A new video — load it immediately
    executeLoadVideo(videoId, syncRef.current?.currentTime || 0)
  }, [videoId, executeLoadVideo])

  // ─── Autoplay intercept: global click/keydown to unmute ──────────────────
  useEffect(() => {
    if (!autoplayBlocked) return
    const unlock = () => {
      try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.() } catch {}
      setAutoplayBlocked(false)
    }
    window.addEventListener('click', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('click', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [autoplayBlocked])

  // ─── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      playerReadyRef.current = false
      if (timeUpdateInterval.current) { clearInterval(timeUpdateInterval.current); timeUpdateInterval.current = null }
      try {
        playerRef.current?.stopVideo?.()
        playerRef.current?.destroy?.()
      } catch {}
      playerRef.current = null
      if (playerInstanceRef) playerInstanceRef.current = null
      try { if (containerRef.current) containerRef.current.innerHTML = '' } catch {}
    }
  }, [playerInstanceRef])

  const handleUnlockAudio = () => {
    try { playerRef.current?.unMute?.(); playerRef.current?.playVideo?.() } catch {}
    setAutoplayBlocked(false)
  }

  return (
    <div
      ref={playerWrapperRef}
      className={`relative w-full transition-all duration-300 ${
        theaterMode ? 'max-w-none' : 'max-w-4xl lg:max-w-5xl mx-auto'
      }`}
    >
      {/* 16:9 Container */}
      <div className="relative w-full aspect-video bg-[#111111] rounded-xl overflow-hidden shadow-2xl border border-[#242424]">
        <div ref={containerRef} className={`w-full h-full ${authorized ? '' : 'pointer-events-none'}`} />

        {/* No video selected */}
        {!videoId && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#181818] z-20 px-6 text-center">
            <div className="max-w-md flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#202020] border border-[#242424] flex items-center justify-center text-[#2885DB] shadow-xl">
                <Film size={28} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">No Video Selected</h3>
                <p className="text-xs text-[#999999] mt-1 max-w-sm leading-relaxed">
                  Search for a video below or paste a YouTube URL to begin streaming together.
                </p>
              </div>
              {onOpenSearch && (
                <button onClick={onOpenSearch} className="btn-primary text-xs mt-1">
                  <Sparkles size={14} />
                  <span>Search or Add Video</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Autoplay intercept pill */}
        {autoplayBlocked && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 animate-bounce">
            <button
              onClick={handleUnlockAudio}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#32C443] hover:bg-[#2DB33D] text-white text-xs font-bold shadow-lg transition-transform active:scale-95"
            >
              <Volume2 size={15} />
              <span>Click to Sync & Play Audio</span>
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {videoId && playerState === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/90 z-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={36} className="text-[#32C443] animate-spin" />
              <p className="text-xs text-[#999999] font-medium">Connecting video stream...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {playerState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#111111]/95 z-20 px-6 text-center">
            <div className="max-w-md flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-1">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-sm font-bold text-white">Video Unavailable</h3>
              <p className="text-xs text-[#999999] leading-relaxed">{playerError}</p>
              <button
                onClick={() => { setPlayerState('loading'); setPlayerError(null); playerRef.current = null; playerReadyRef.current = false; initPlayer() }}
                className="btn-secondary text-xs mt-3 flex items-center gap-1.5"
              >
                <RefreshCw size={12} />
                Retry Playback
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
