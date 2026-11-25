import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LogOut,
  Wifi,
  WifiOff,
  Users,
  MessageSquare,
  Bell,
  Link2,
  Send,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Loader2,
  Film,
  Plus,
  Sparkles,
  Share2,
  Tv,
  Maximize2,
  Minimize2,
  Shield,
  Clock,
  RefreshCw,
  Play,
  AlertCircle
} from 'lucide-react'
import VideoPlayer from '../components/VideoPlayer.jsx'
import PlaybackControls from '../components/PlaybackControls.jsx'
import ParticipantList from '../components/ParticipantList.jsx'
import ChatBox from '../components/ChatBox.jsx'
import RequestPanel from '../components/RequestPanel.jsx'
import VideoQueuePanel from '../components/VideoQueuePanel.jsx'
import RoomSearchModal from '../components/RoomSearchModal.jsx'
import IntegratedVideoSearch from '../components/IntegratedVideoSearch.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  isValidYouTubeUrl,
  extractVideoId,
  hasPermission,
  copyToClipboard,
  saveRecentRoom
} from '../utils/helpers.js'
import api from '../services/api.js'

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'participants', label: 'People', icon: Users },
  { id: 'queue', label: 'Queue', icon: Film },
  { id: 'requests', label: 'Requests', icon: Bell },
]

const WatchRoom = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { emit, on, off, connected } = useSocket()
  const { user } = useAuth()

  // Session information (prefer tab-scoped sessionStorage so two tabs in the same browser don't collide)
  const sessionKey = `syncplay_room_${roomId}`
  const session = JSON.parse(sessionStorage.getItem(sessionKey) || localStorage.getItem(sessionKey) || '{}')
  const userId = session.userId || user?.userId || user?._id || localStorage.getItem('syncplay_guest_id') || `guest_${Math.random().toString(36).substring(2, 9)}`
  const username = session.username || user?.username || localStorage.getItem('syncplay_username') || 'Guest'

  // Room state
  const [roomData, setRoomData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roomLoadError, setRoomLoadError] = useState(null)

  // Playback & Video state
  const [syncState, setSyncState] = useState({
    playState: 'paused',
    currentTime: 0,
    stateVersion: 0,
    videoId: '',
  })
  const [videoTitle, setVideoTitle] = useState('')
  const [videoChannel, setVideoChannel] = useState('')
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  // Queue & Requests
  const [queue, setQueue] = useState([])
  const [autoplayNext, setAutoplayNext] = useState(true)
  const [participants, setParticipants] = useState([])
  const [messages, setMessages] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])

  // User role in room
  const [myRole, setMyRole] = useState(session.role || 'participant')

  // UI state & Viewing Modes
  const [activeTab, setActiveTab] = useState('chat')
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theaterMode, setTheaterMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [resynced, setResynced] = useState(false)
  const [requestFeedback, setRequestFeedback] = useState('')

  // playerRef is now the imperative handle from VideoPlayer (forwardRef + useImperativeHandle)
  // playerRef.current exposes: play(t), pause(t), seek(t), loadVideo(id, t), applySyncState(s), getCurrentTime(), getPlayerState()
  const playerRef = useRef(null)
  // playerInstanceRef is the raw YT player instance for PlaybackControls volume control
  const playerInstanceRef = useRef(null)
  const playerWrapperRef = useRef(null)
  const isRemoteSyncRef = useRef(false)
  // Keep a stable ref of myRole for use inside socket handlers (avoids stale closure)
  const myRoleRef = useRef(session.role || 'participant')
  const userIdRef = useRef(userId)

  const isAuthorized = myRole === 'host' || myRole === 'moderator'

  // Fetch initial room data from backend
  useEffect(() => {
    const loadRoom = async () => {
      if (!userId) {
        navigate('/join/' + roomId)
        return
      }
      try {
        const res = await api.get(`/rooms/${roomId}`)
        const room = res.data.room
        setRoomData(room)
        setSyncState({
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime,
          stateVersion: room.stateVersion,
        })
        setParticipants(room.participants || [])
        setQueue(room.queue || [])

        const me = room.participants?.find((p) => p.userId === userId)
        if (me) {
          setMyRole(me.role)
          const updatedSession = JSON.stringify({ ...session, role: me.role })
          sessionStorage.setItem(sessionKey, updatedSession)
          localStorage.setItem(sessionKey, updatedSession)
        }

        saveRecentRoom({
          roomId: room.roomId,
          roomName: room.roomName,
          videoId: room.videoId,
          role: me ? me.role : myRole,
        })

        // Fetch YouTube metadata for title
        fetchVideoInfo(room.videoId)
      } catch (err) {
        console.warn('Failed to load room data:', err)
        setRoomLoadError(err.response?.data?.error || 'Room not found or no longer active.')
      } finally {
        setLoading(false)
      }
    }
    loadRoom()
  }, [roomId])

  // Fetch real YouTube video title & channel via oEmbed
  const fetchVideoInfo = async (vid) => {
    if (!vid) return
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`)
      if (res.ok) {
        const data = await res.json()
        setVideoTitle(data.title)
        setVideoChannel(data.author_name)
      }
    } catch {
      setVideoTitle(`YouTube Stream (${vid})`)
    }
  }

  // Keep role ref in sync
  useEffect(() => { myRoleRef.current = myRole }, [myRole])

  // Socket connection & event listeners
  useEffect(() => {
    if (!roomData || !userId) return

    emit('join_room', {
      roomId,
      userId,
      username,
      role: myRole,
      videoId: roomData.videoId,
      roomName: roomData.roomName,
    })

    const handlers = {
      // ── Imperative play command: directly call player.play() — no React re-render in hot path ──
      player_play: ({ currentTime: targetTime, stateVersion, triggeredBy }) => {
        // Update React state for UI (progress bar, sync indicator)
        setSyncState((prev) => ({
          ...prev,
          playState: 'playing',
          currentTime: targetTime !== undefined ? targetTime : prev.currentTime,
          stateVersion: stateVersion ?? (prev.stateVersion + 1),
          receivedAt: Date.now(),
        }))
        // Execute on player immediately — do NOT skip for the triggering user
        // because the host's own click already played their local player via onDirectPlay.
        // We only command the player if we are NOT the one who sent this event.
        if (triggeredBy !== userIdRef.current) {
          playerRef.current?.play?.(targetTime)
        }
      },

      // ── Imperative pause command ──
      player_pause: ({ currentTime: targetTime, stateVersion, triggeredBy }) => {
        setSyncState((prev) => ({
          ...prev,
          playState: 'paused',
          currentTime: targetTime !== undefined ? targetTime : prev.currentTime,
          stateVersion: stateVersion ?? (prev.stateVersion + 1),
          receivedAt: Date.now(),
        }))
        if (triggeredBy !== userIdRef.current) {
          playerRef.current?.pause?.(targetTime)
        }
      },

      // ── Imperative seek command ──
      player_seek: ({ currentTime: targetTime, time, stateVersion, triggeredBy }) => {
        const finalTime = targetTime !== undefined ? targetTime : time
        setSyncState((prev) => ({
          ...prev,
          currentTime: finalTime,
          stateVersion: stateVersion ?? (prev.stateVersion + 1),
          receivedAt: Date.now(),
        }))
        if (triggeredBy !== userIdRef.current && finalTime !== undefined) {
          playerRef.current?.seek?.(finalTime)
        }
      },

      // ── Full sync_state: applies authoritative room state (late joiners, reconnects) ──
      sync_state: (state) => {
        setSyncState({ ...state, receivedAt: Date.now() })
        if (state.participants) setParticipants(state.participants)
        if (state.queue) setQueue(state.queue)
        if (state.autoplayNext !== undefined) setAutoplayNext(state.autoplayNext)
        if (state.videoId) fetchVideoInfo(state.videoId)
        const me = state.participants?.find((p) => p.userId === userId)
        if (me && me.role !== myRoleRef.current) {
          setMyRole(me.role)
        }
        // Apply authoritative playback position to player
        playerRef.current?.applySyncState?.({ ...state, receivedAt: Date.now() })
      },

      // ── Video change: load new video on all clients ──
      change_video: ({ videoId: newVideoId, currentTime: startTime, playState }) => {
        setSyncState((prev) => ({
          ...prev,
          videoId: newVideoId,
          playState: playState || 'playing',
          currentTime: startTime || 0,
          stateVersion: (prev.stateVersion || 0) + 1,
          receivedAt: Date.now(),
        }))
        fetchVideoInfo(newVideoId)
        playerRef.current?.loadVideo?.(newVideoId, startTime || 0)
      },

      autoplay_toggled: ({ autoplayNext: ap }) => setAutoplayNext(ap),
      queue_updated: ({ queue: newQueue }) => setQueue(newQueue || []),

      user_joined: ({ participants: ps }) => { if (ps) setParticipants(ps) },
      user_left: ({ participants: ps }) => { if (ps) setParticipants(ps) },
      role_assigned: ({ userId: uid, newRole, participants: ps }) => {
        if (ps) setParticipants(ps)
        if (uid === userId) setMyRole(newRole)
      },
      participant_removed: ({ userId: uid, participants: ps }) => {
        if (uid === userId) {
          try { playerRef.current?.pause?.() } catch {}
          emit('leave_room', {})
          navigate('/', { replace: true })
        } else {
          if (ps) setParticipants(ps)
        }
      },
      control_requested: (req) => {
        if (myRoleRef.current === 'host' || myRoleRef.current === 'moderator') {
          setPendingRequests((prev) => {
            if (prev.find((r) => r.requestId === req.requestId)) return prev
            return [...prev, req]
          })
        }
      },
      request_approved: ({ requestId, message, action }) => {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId))
        const note = message || (action ? `Request (${action}) approved!` : 'Request approved!')
        setRequestFeedback(note)
        setTimeout(() => setRequestFeedback(''), 3500)
      },
      request_rejected: ({ requestId, message, action }) => {
        setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId))
        const note = message || (action ? `Request (${action}) was rejected.` : 'Request was rejected.')
        setRequestFeedback(note)
        setTimeout(() => setRequestFeedback(''), 3500)
      },
      receive_message: (msg) => {
        if (!msg) return
        setMessages((prev) => {
          if (msg._id && prev.some((m) => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        setActiveTab((currentTab) => {
          if (currentTab !== 'chat') setUnreadChatCount((prev) => prev + 1)
          return currentTab
        })
      },
      chat_history: (history) => { if (Array.isArray(history)) setMessages(history) },
      host_transferred: ({ newHostId, participants: ps }) => {
        if (ps) setParticipants(ps)
        if (newHostId === userId) setMyRole('host')
      },
      room_error: ({ message: errMsg }) => {
        console.warn('[WatchRoom] room_error:', errMsg)
        if (errMsg) { setRequestFeedback(errMsg); setTimeout(() => setRequestFeedback(''), 3500) }
      },
    }

    Object.entries(handlers).forEach(([event, handler]) => on(event, handler))

    return () => {
      Object.keys(handlers).forEach((event) => off(event, handlers[event]))
      emit('leave_room', {})
    }
  }, [roomData, userId])

  // Re-emit join_room on socket reconnect
  useEffect(() => {
    if (connected && roomData && userId) {
      emit('join_room', {
      roomId,
      userId,
      username,
      role: myRole,
      videoId: roomData.videoId,
      roomName: roomData.roomName,
    })
    }
  }, [connected])

  // Playback handlers
  const handlePlay = useCallback((optTime) => {
    const curTime = typeof optTime === 'number' && !isNaN(optTime)
      ? optTime
      : (playerRef.current?.getCurrentTime?.() ?? currentTime)
    if (!isAuthorized) {
      emit('request_control', { action: 'play', payload: { currentTime: curTime } })
      setRequestFeedback('Play request sent')
      setTimeout(() => setRequestFeedback(''), 2500)
      return
    }
    // Also start host's own player immediately if triggered from custom PlaybackControls
    if (playerRef.current?.getPlayerState?.() !== 1) {
      playerRef.current?.play?.(curTime)
    }
    emit('play', { roomId, currentTime: curTime })
  }, [isAuthorized, currentTime, roomId, emit])

  const handlePause = useCallback((optTime) => {
    const curTime = typeof optTime === 'number' && !isNaN(optTime)
      ? optTime
      : (playerRef.current?.getCurrentTime?.() ?? currentTime)
    if (!isAuthorized) {
      emit('request_control', { action: 'pause', payload: { currentTime: curTime } })
      setRequestFeedback('Pause request sent')
      setTimeout(() => setRequestFeedback(''), 2500)
      return
    }
    if (playerRef.current?.getPlayerState?.() === 1) {
      playerRef.current?.pause?.(curTime)
    }
    emit('pause', { roomId, currentTime: curTime })
  }, [isAuthorized, currentTime, roomId, emit])

  const handleSeek = useCallback(
    (time) => {
      const target = typeof time === 'number' && !isNaN(time) ? Math.max(0, time) : 0
      if (!isAuthorized) {
        emit('request_control', { action: 'seek', payload: { currentTime: target } })
        setRequestFeedback('Seek request sent')
        setTimeout(() => setRequestFeedback(''), 2500)
        return
      }
      playerRef.current?.seek?.(target)
      emit('seek', { roomId, currentTime: target })
    },
    [isAuthorized, roomId, emit]
  )

  // Direct video change from modal or input
  const handlePlayNow = ({ videoId, title, videoUrl }) => {
    if (!isAuthorized) {
      emit('request_control', {
        action: 'changeVideo',
        payload: { videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}` },
      })
      setRequestFeedback('Video change request sent')
      setTimeout(() => setRequestFeedback(''), 2500)
      return
    }
    emit('change_video', {
      roomId,
      videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
    })
  }

  // Queue actions
  const handleAddToQueue = (video) => {
    emit('queue_add', { video })
  }

  const handleRemoveQueueItem = (queueId) => {
    emit('queue_remove', { queueId })
  }

  const handleReorderQueue = (fromIndex, toIndex) => {
    emit('queue_reorder', { fromIndex, toIndex })
  }

  const handlePlayNext = () => {
    emit('queue_play_next')
  }

  const handleClearQueue = () => {
    emit('queue_clear')
  }

  const handleShuffleQueue = () => {
    emit('queue_shuffle')
  }

  const handleToggleAutoplay = (enabled) => {
    emit('toggle_autoplay', { enabled })
  }

  const handlePlayItemNow = (item) => {
    handlePlayNow({
      videoId: item.videoId,
      title: item.title,
      videoUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
    })
  }

  const handleResync = useCallback(() => {
    emit('request_resync')
    // Use the imperative handle (forwardRef) — seek/play/pause via clean API
    const target = syncState.playState === 'playing' && syncState.receivedAt
      ? (syncState.currentTime || 0) + (Date.now() - syncState.receivedAt) / 1000
      : (syncState.currentTime || 0)
    playerRef.current?.seek?.(target)
    if (syncState.playState === 'playing') {
      playerRef.current?.play?.(target)
    } else {
      playerRef.current?.pause?.(target)
    }
    setResynced(true)
    setTimeout(() => setResynced(false), 2000)
  }, [emit, syncState])

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerWrapperRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true))
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false))
    }
  }

  // Role assignment & removal
  const handleAssignRole = (targetUserId, newRole) => {
    emit('assign_role', { targetUserId, newRole })
  }

  const handleRemoveParticipant = (targetUserId) => {
    if (window.confirm('Remove this user from the watch party?')) {
      emit('remove_participant', { targetUserId })
    }
  }

  const handleApproveRequest = (requestId) => {
    emit('approve_request', { requestId })
  }

  const handleRejectRequest = (requestId) => {
    emit('reject_request', { requestId })
  }

  const handleTransferHost = (targetUserId) => {
    emit('transfer_host', { targetUserId })
  }

  const handleParticipantRequestAction = (action, payload) => {
    emit('request_control', { action, payload })
    setRequestFeedback(`${action.toUpperCase()} request sent to host`)
    setTimeout(() => setRequestFeedback(''), 2500)
  }

  const handleSendMessage = (message, type = 'chat', emoji = null) => {
    if (!message || !message.trim()) return
    emit('send_message', {
      roomId,
      userId,
      username,
      message: message.trim(),
      type,
      emoji,
    })
  }

  const handleCopyCode = async () => {
    await copyToClipboard(roomId)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/join/${roomId}`
    await copyToClipboard(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleLeaveRoom = () => {
    try { playerRef.current?.pause?.() } catch {}
    emit('leave_room', {})
    navigate('/', { replace: true })
  }

  const currentTargetTime = syncState.playState === 'playing'
    ? (syncState.currentTime || 0) + (Date.now() - (syncState.receivedAt || Date.now())) / 1000
    : (syncState.currentTime || 0)
  const drift = Math.abs(currentTime - currentTargetTime)
  const isSynchronized = connected && (syncState.playState === 'paused' || drift <= 1.5)

  const lastDriftFixRef = useRef(0)

  // Auto background drift correction for participants if drift exceeds 0.8s (with 2.5s cooldown)
  useEffect(() => {
    if (!isAuthorized && syncState.playState === 'playing' && playerRef.current?.seek) {
      const now = Date.now()
      if (drift > 0.8 && now - lastDriftFixRef.current > 2500) {
        lastDriftFixRef.current = now
        playerRef.current.seek(currentTargetTime)
      }
    }
  }, [drift, isAuthorized, syncState.playState, currentTargetTime])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="text-[#32C443] animate-spin" />
          <p className="text-xs text-[#999999] font-semibold tracking-wider uppercase">Loading Watch Room...</p>
        </div>
      </div>
    )
  }

  if (roomLoadError) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-[#181818] border border-[#242424] rounded-[16px] p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Watch Room Unavailable</h2>
            <p className="text-xs text-[#999999] mt-1">{roomLoadError}</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full py-2.5 text-xs"
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] flex flex-col select-none">
      {/* ─── Top Room Control Header ─── */}
      <header className="h-14 bg-[#181818] border-b border-[#242424] px-4 md:px-6 flex items-center justify-between flex-shrink-0 z-30">
        {/* Left: YouTube Play Branding & Room Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-6 rounded-md bg-[#FF0033] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Play size={12} fill="white" className="text-white ml-0.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs md:text-sm font-bold text-[#FFFFFF] truncate max-w-[140px] sm:max-w-xs">
                {roomData?.roomName}
              </h1>
              {/* Room Code Badge */}
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#202020] border border-[#242424] hover:border-[#333333] text-[#999999] hover:text-white transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={11} className="text-[#32C443]" /> : <Copy size={11} />}
                <span>{roomId}</span>
              </button>

              {/* Inline feedback chip for participant playback requests */}
              {requestFeedback && (
                <span className="inline-flex items-center text-[10px] font-semibold text-[#32C443] bg-[#32C443]/15 border border-[#32C443]/30 px-2 py-0.5 rounded-full animate-fade-in truncate max-w-[150px] sm:max-w-xs">
                  {requestFeedback}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls & Role Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <RoleBadge role={myRole} />

          <button
            onClick={handleCopyLink}
            className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
              copiedLink
                ? 'bg-[#32C443]/20 border border-[#32C443]/40 text-[#32C443]'
                : 'bg-[#32C443] hover:bg-[#2DB33D] text-white shadow-sm active:scale-95'
            }`}
            title="Copy Shareable Party Link"
          >
            {copiedLink ? <Check size={13} /> : <Share2 size={13} />}
            <span>{copiedLink ? 'Copied' : 'Invite'}</span>
          </button>

          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* ─── Main Content Layout (Desktop YouTube Split vs Theater Mode) ─── */}
      <div className={`flex flex-1 overflow-hidden ${theaterMode ? 'flex-col overflow-y-auto' : 'flex-col md:flex-row'}`}>
        {/* ─── Video & Playback Column ─── */}
        <div className={`flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#111111] ${theaterMode ? 'w-full' : 'min-w-0'}`}>
          {/* Sized Video Player Wrapper */}
          <div className="w-full mb-3">
            <VideoPlayer
              ref={playerRef}
              playerWrapperRef={playerWrapperRef}
              playerInstanceRef={playerInstanceRef}
              videoId={syncState.videoId || roomData?.videoId}
              syncState={syncState}
              theaterMode={theaterMode}
              onToggleTheater={() => setTheaterMode(!theaterMode)}
              onDurationChange={setDuration}
              onTimeUpdate={setCurrentTime}
              onEnded={isAuthorized && autoplayNext && queue.length > 0 ? handlePlayNext : undefined}
              onOpenSearch={() => setSearchModalOpen(true)}
              authorized={isAuthorized}
              onDirectPlay={handlePlay}
              onDirectPause={handlePause}
              onDirectSeek={handleSeek}
              isRemoteSyncRef={isRemoteSyncRef}
            />
          </div>

          {/* Synchronized Playback Controls */}
          <div className={`w-full mb-4 ${theaterMode ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}`}>
            <PlaybackControls
              isPlaying={syncState.playState === 'playing'}
              currentTime={currentTime}
              duration={duration}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onNextQueue={handlePlayNext}
              onResync={handleResync}
              hasQueueItem={queue.length > 0}
              isAuthorized={isAuthorized}
              theaterMode={theaterMode}
              onToggleTheater={() => setTheaterMode(!theaterMode)}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              playerRef={playerInstanceRef}
              onOpenSearch={() => setSearchModalOpen(true)}
            />
          </div>

          {/* Video Metadata & Quick Actions */}
          <div className={`w-full bg-[#181818] border border-[#242424] rounded-[16px] p-4 md:p-5 mb-4 ${
            theaterMode ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {videoTitle || roomData?.roomName || 'YouTube Video Stream'}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#999999]">
                  <span className="font-medium text-white">{videoChannel || 'YouTube'}</span>
                  <span>·</span>
                  <span>ID: {syncState.videoId || roomData?.videoId}</span>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchModalOpen(true)}
                  className="btn-primary text-xs px-3.5 py-2"
                >
                  <Sparkles size={14} />
                  <span>{isAuthorized ? 'Change Video' : 'Suggest Video'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('queue')}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  <Film size={14} />
                  <span>Queue ({queue.length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Integrated YouTube Search Section (GroupTube Inspiration) */}
          <div className={`w-full mb-6 ${theaterMode ? '' : 'max-w-4xl lg:max-w-5xl mx-auto'}`}>
            <IntegratedVideoSearch
              onPlayNow={handlePlayNow}
              onAddToQueue={handleAddToQueue}
              isAuthorized={isAuthorized}
              userRole={myRole}
            />
          </div>
        </div>

        {/* ─── Right Collapsible Sidebar (Chat, People, Queue, Requests) ─── */}
        <aside
          className={`bg-[#181818] border-t md:border-t-0 md:border-l border-[#242424] flex flex-col flex-shrink-0 transition-all duration-200 ${
            theaterMode
              ? 'w-full h-96 border-t border-[#242424]'
              : sidebarOpen
              ? 'w-full md:w-80 lg:w-96 h-80 md:h-full'
              : 'w-full md:w-12 h-12 md:h-full'
          }`}
        >
          {/* Tab Selection Header */}
          <div className="flex items-center justify-between border-b border-[#242424] bg-[#181818] px-1">
            <div className="flex flex-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setSidebarOpen(true)
                      if (tab.id === 'chat') {
                        setUnreadChatCount(0)
                      }
                    }}
                    className={`flex-1 py-3 px-2 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors relative ${
                      isActive ? 'text-white' : 'text-[#999999] hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.id === 'chat' && unreadChatCount > 0 && activeTab !== 'chat' && (
                      <span className="w-4 h-4 rounded-full bg-[#2885DB] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                    {tab.id === 'requests' && pendingRequests.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#FF0033] text-white text-[9px] font-bold flex items-center justify-center">
                        {pendingRequests.length}
                      </span>
                    )}
                    {tab.id === 'queue' && queue.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#32C443]/20 text-[#32C443] text-[9px] font-bold flex items-center justify-center">
                        {queue.length}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#32C443]"
                      />
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-2 text-[#999999] hover:text-white transition-colors"
              title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              {sidebarOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

          {/* Active Tab Panel Content (Kept mounted to prevent socket drops & preserve state) */}
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden relative bg-[#111111]">
              <div className={`h-full ${activeTab === 'chat' ? 'flex flex-col' : 'hidden'}`}>
                <ChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  currentUserId={userId}
                />
              </div>

              <div className={`h-full ${activeTab === 'participants' ? 'block overflow-y-auto' : 'hidden'}`}>
                <ParticipantList
                  participants={participants}
                  currentUserId={userId}
                  currentUserRole={myRole}
                  onAssignRole={handleAssignRole}
                  onRemove={handleRemoveParticipant}
                  onTransferHost={handleTransferHost}
                />
              </div>

              <div className={`h-full ${activeTab === 'queue' ? 'block overflow-y-auto' : 'hidden'}`}>
                <VideoQueuePanel
                  queue={queue}
                  currentVideoId={syncState.videoId || roomData?.videoId}
                  isAuthorized={isAuthorized}
                  autoplayNext={autoplayNext}
                  onPlayNext={handlePlayNext}
                  onPlayItemNow={handlePlayItemNow}
                  onRemoveQueueItem={handleRemoveQueueItem}
                  onReorderQueue={handleReorderQueue}
                  onClearQueue={handleClearQueue}
                  onShuffleQueue={handleShuffleQueue}
                  onToggleAutoplay={handleToggleAutoplay}
                  onOpenSearch={() => setSearchModalOpen(true)}
                />
              </div>

              <div className={`h-full ${activeTab === 'requests' ? 'block overflow-y-auto' : 'hidden'}`}>
                <RequestPanel
                  requests={pendingRequests}
                  currentUserRole={myRole}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onRequestAction={handleParticipantRequestAction}
                  currentTime={currentTime}
                />
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* ─── Search & Add Video Modal ─── */}
      <RoomSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onPlayNow={handlePlayNow}
        onAddToQueue={handleAddToQueue}
        isAuthorized={isAuthorized}
      />
    </div>
  )
}

export default WatchRoom
