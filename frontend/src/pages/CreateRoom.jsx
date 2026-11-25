import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Link2, User, Hash, Loader2, Play, ArrowRight, Copy, Check, Sparkles, AlertCircle } from 'lucide-react'
import YouTubeThumbnail from '../components/YouTubeThumbnail.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isValidYouTubeUrl, extractVideoId, copyToClipboard, saveRecentRoom } from '../utils/helpers.js'
import api from '../services/api.js'

const CreateRoom = () => {
  const [searchParams] = useSearchParams()
  const initialUrl = searchParams.get('videoUrl') || ''
  const initialTitle = searchParams.get('title') || ''

  const { user, setGuestUser, updateUsername } = useAuth()
  const [form, setForm] = useState({
    username: user?.username || localStorage.getItem('syncplay_username') || '',
    roomName: initialTitle || '',
    videoUrl: initialUrl || '',
  })
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (initialUrl && !form.videoUrl) {
      setForm((f) => ({ ...f, videoUrl: initialUrl }))
    }
    if (initialTitle && !form.roomName) {
      setForm((f) => ({ ...f, roomName: initialTitle }))
    }
  }, [initialUrl, initialTitle])

  const videoId = extractVideoId(form.videoUrl)

  const handleChange = (e) => {
    setError('')
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const username = form.username.trim()
    if (!username) {
      setError('Please enter your display name')
      return
    }
    if (!form.roomName.trim()) {
      setError('Please enter a room name')
      return
    }
    if (!form.videoUrl.trim()) {
      setError('Please enter a YouTube video URL or ID')
      return
    }
    if (!isValidYouTubeUrl(form.videoUrl)) {
      setError('Invalid YouTube URL or ID')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/rooms', {
        username,
        roomName: form.roomName.trim(),
        videoUrl: form.videoUrl.trim(),
      })
      const { room, userId, username: serverUsername } = res.data

      // Save display name & guest session
      updateUsername(serverUsername)
      setGuestUser(serverUsername, userId)

      // Store host session for this room (sessionStorage keeps tabs isolated in same browser)
      const hostSession = JSON.stringify({
        userId,
        username: serverUsername,
        role: 'host',
      })
      sessionStorage.setItem(`syncplay_room_${room.roomId}`, hostSession)
      localStorage.setItem(`syncplay_room_${room.roomId}`, hostSession)

      // Save to recent rooms
      saveRecentRoom({
        roomId: room.roomId,
        roomName: room.roomName,
        videoId: room.videoId,
        role: 'host',
      })

      setCreated({ ...room, userId, username: serverUsername })
    } catch (err) {
      console.error('Create room error:', err)
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create room. Please try again.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEnterRoom = () => {
    navigate(`/room/${created.roomId}`)
  }

  const handleCopyInvite = async () => {
    const url = `${window.location.origin}/join/${created.roomId}`
    await copyToClipboard(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#111111] text-[#FFFFFF] select-none">
      <div className="relative w-full max-w-lg">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#181818] border border-[#242424] rounded-full px-3.5 py-1 mb-3">
            <div className="w-4 h-3 rounded-sm bg-[#FF0033] flex items-center justify-center">
              <Play size={8} fill="white" className="text-white ml-px" />
            </div>
            <span className="text-[11px] text-[#999999] font-semibold uppercase tracking-wider">SyncPlay Watch Party</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Create a Watch Room</h1>
          <p className="text-xs text-[#999999] mt-1">Host friends and stream YouTube together in real-time sync.</p>
        </motion.div>

        {!created ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 md:p-7 shadow-lg"
          >
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username (Display Name) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F98B2] mb-1.5">
                  Your Display Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="e.g. Alex"
                    className="input-field pl-10"
                    maxLength={25}
                    required
                  />
                </div>
              </div>

              {/* Room Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F98B2] mb-1.5">
                  Party Name
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
                  <input
                    type="text"
                    name="roomName"
                    value={form.roomName}
                    onChange={handleChange}
                    placeholder="e.g. Movie Night"
                    className="input-field pl-10"
                    maxLength={50}
                    required
                  />
                </div>
              </div>

              {/* YouTube Video URL or ID */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F98B2] mb-1.5">
                  YouTube Video Link or ID
                </label>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
                  <input
                    type="text"
                    name="videoUrl"
                    value={form.videoUrl}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=... or Video ID"
                    className="input-field pl-10"
                    required
                  />
                </div>
              </div>

              {/* Live Thumbnail Preview */}
              {videoId && (
                <div className="rounded-xl overflow-hidden bg-[#1C2029] border border-white/10 p-3">
                  <p className="text-[11px] font-semibold text-[#8F98B2] uppercase tracking-wider mb-2">Selected Video Preview</p>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <YouTubeThumbnail videoId={videoId} title="Preview" />
                  </div>
                  <p className="text-xs text-white font-mono mt-1.5 truncate">Video ID: {videoId}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Watch Party...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>Create Watch Room (Host)</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          /* Success Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#16181F] border border-emerald-500/30 rounded-2xl p-6 md:p-7 shadow-2xl text-center space-y-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Check size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">Watch Party Ready!</h2>
              <p className="text-xs text-[#8F98B2] mt-1">
                Room <span className="font-bold text-white">"{created.roomName}"</span> is live.
              </p>
            </div>

            {/* Room Code */}
            <div className="p-4 bg-[#1C2029] border border-white/5 rounded-xl">
              <p className="text-[10px] text-[#8F98B2] uppercase tracking-wider font-semibold mb-1">Room Code</p>
              <span className="font-mono text-2xl font-black text-blue-400 tracking-widest">{created.roomId}</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleCopyInvite}
                className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
              </button>

              <button
                onClick={handleEnterRoom}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <span>Enter Watch Room</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CreateRoom
