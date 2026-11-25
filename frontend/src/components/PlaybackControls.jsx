import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  Tv,
  SkipForward,
  Sparkles,
  RefreshCw
} from 'lucide-react'
import { formatTime } from '../utils/helpers.js'

const PlaybackControls = ({
  isPlaying,
  currentTime = 0,
  duration = 0,
  onPlay,
  onPause,
  onSeek,
  onNextQueue,
  onResync,
  hasQueueItem = false,
  isAuthorized = false,
  theaterMode = false,
  onToggleTheater,
  onToggleFullscreen,
  isFullscreen = false,
  playerRef,
  onOpenSearch,
}) => {
  const [seeking, setSeeking] = useState(false)
  const [localTime, setLocalTime] = useState(currentTime || 0)
  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const progressRef = useRef(null)

  useEffect(() => {
    if (!seeking) setLocalTime(currentTime || 0)
  }, [currentTime, seeking])

  // Keyboard Shortcuts (Space/k: play/pause, j/l: -10s/+10s, m: mute, f: fullscreen, t: theater)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in form inputs or modals
      const activeTag = document.activeElement?.tagName?.toLowerCase()
      if (activeTag === 'input' || activeTag === 'textarea') return

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        if (isAuthorized) {
          if (isPlaying) onPause?.()
          else onPlay?.()
        }
      } else if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        if (isAuthorized) onSeek?.(Math.max(0, localTime - 10))
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault()
        if (isAuthorized) onSeek?.(Math.min(duration, localTime + 10))
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        handleToggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        onToggleFullscreen?.()
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        onToggleTheater?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isAuthorized, localTime, duration, isMuted, volume])

  // Volume & Mute Handling via Player Ref
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    if (playerRef?.current) {
      try {
        if (newVolume === 0) {
          playerRef.current.mute?.()
        } else {
          playerRef.current.unMute?.()
          playerRef.current.setVolume?.(newVolume)
        }
      } catch {}
    }
  }

  const handleToggleMute = () => {
    const nextMute = !isMuted
    setIsMuted(nextMute)
    if (playerRef?.current) {
      try {
        if (nextMute) {
          playerRef.current.mute?.()
        } else {
          playerRef.current.unMute?.()
          playerRef.current.setVolume?.(volume > 0 ? volume : 80)
        }
      } catch {}
    }
  }

  const handleProgressClick = (e) => {
    if (!duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * duration
    setLocalTime(newTime)
    if (isAuthorized) {
      onSeek?.(newTime)
    }
  }

  const handleMouseDown = (e) => {
    if (!isAuthorized) return
    setSeeking(true)
    handleProgressClick(e)
  }

  const handleMouseUp = () => {
    if (seeking) setSeeking(false)
  }

  const progressPercent = duration > 0 ? (localTime / duration) * 100 : 0

  return (
    <div
      onMouseUp={handleMouseUp}
      className="bg-[#181818] border border-[#242424] rounded-[16px] p-3 md:p-4 flex flex-col gap-3 shadow-sm select-none"
    >
      {/* ─── Interactive Progress Bar ─── */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => seeking && handleProgressClick(e)}
        className="relative h-2 bg-[#242424] rounded-full group cursor-pointer"
        title={isAuthorized ? 'Click or drag to seek' : 'Click to request seek position'}
      >
        {/* Fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all bg-[#32C443]"
          style={{
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
          }}
        />
        {/* Scrubber Knob */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ left: `calc(${Math.min(100, Math.max(0, progressPercent))}% - 7px)` }}
        />
      </div>

      {/* ─── Controls Bar ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#999999]">
        {/* Left Side: Play/Pause, Rewind, Forward, Next Queue, Timestamp */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play / Pause Toggle (Authorized direct or Participant request) */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white active:scale-95 transition-all shadow-sm ${
              isAuthorized
                ? 'bg-[#32C443] hover:bg-[#2DB33D]'
                : 'bg-[#202020] hover:bg-[#282828] border border-[#32C443]/40 text-[#32C443]'
            }`}
            title={
              isAuthorized
                ? isPlaying ? 'Pause Party' : 'Play Party'
                : isPlaying ? 'Request Host to Pause' : 'Request Host to Play'
            }
          >
            {isPlaying ? (
              <Pause size={17} fill={isAuthorized ? 'white' : '#32C443'} />
            ) : (
              <Play size={17} fill={isAuthorized ? 'white' : '#32C443'} className="ml-0.5" />
            )}
          </button>

          {/* Rewind 10s */}
          <button
            onClick={() => onSeek?.(Math.max(0, localTime - 10))}
            className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] flex items-center justify-center text-white transition-colors"
            title={isAuthorized ? 'Rewind 10 seconds' : 'Request Rewind 10 seconds'}
          >
            <RotateCcw size={14} />
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => onSeek?.(Math.min(duration, localTime + 10))}
            className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] flex items-center justify-center text-white transition-colors"
            title={isAuthorized ? 'Forward 10 seconds' : 'Request Forward 10 seconds'}
          >
            <RotateCw size={14} />
          </button>

          {/* Next Video from Queue */}
          {isAuthorized && hasQueueItem && (
            <button
              onClick={onNextQueue}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2885DB] hover:bg-[#2070BC] text-white transition-all text-xs font-medium shadow-sm"
              title="Play next video from queue"
            >
              <SkipForward size={14} />
              <span className="hidden sm:inline">Next in Queue</span>
            </button>
          )}

          {/* Time Display */}
          <div className="font-mono text-xs text-white/90 ml-1">
            <span>{formatTime(localTime)}</span>
            <span className="text-[#999999] mx-1">/</span>
            <span className="text-[#999999]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Side: Volume, Search/Add, Theater Mode, Fullscreen */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5 group/vol">
            <button
              onClick={handleToggleMute}
              className="text-[#999999] hover:text-white p-1 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} className="text-[#FF0033]" />
              ) : volume < 50 ? (
                <Volume1 size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-16 sm:w-20 accent-[#32C443] h-1 bg-[#242424] rounded-lg cursor-pointer"
              title={`Volume: ${isMuted ? 0 : volume}%`}
            />
          </div>

          {/* Resynchronize Playback Button */}
          {onResync && (
            <button
              onClick={onResync}
              className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] flex items-center justify-center text-[#999999] hover:text-white transition-colors"
              title="Resynchronize video with watch party"
            >
              <RefreshCw size={14} />
            </button>
          )}

          {/* Add / Search Video Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-white text-xs transition-colors border border-[#242424]"
              title="Search or Add Video"
            >
              <Sparkles size={14} className="text-[#32C443]" />
              <span className="hidden md:inline">Change / Queue</span>
            </button>
          )}

          {/* Theater Mode Toggle */}
          <button
            onClick={onToggleTheater}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-[#242424] ${
              theaterMode ? 'bg-[#32C443]/20 text-[#32C443]' : 'bg-[#202020] hover:bg-[#282828] text-white'
            }`}
            title={theaterMode ? 'Exit Theater Mode' : 'Theater Mode'}
          >
            <Tv size={15} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="w-8 h-8 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] flex items-center justify-center text-white transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlaybackControls
