import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Hash, Loader2, Play, ArrowRight, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { saveRecentRoom } from '../utils/helpers.js'
import api from '../services/api.js'

const JoinRoom = () => {
  const { roomCode } = useParams()
  const { user, setGuestUser, updateUsername } = useAuth()
  const [form, setForm] = useState({
    username: user?.username || localStorage.getItem('syncplay_username') || '',
    roomId: roomCode ? roomCode.toUpperCase() : '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (roomCode) setForm((f) => ({ ...f, roomId: roomCode.toUpperCase() }))
  }, [roomCode])

  const handleChange = (e) => {
    setError('')
    const val = e.target.name === 'roomId' ? e.target.value.toUpperCase() : e.target.value
    setForm((f) => ({ ...f, [e.target.name]: val }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const username = form.username.trim()
    if (!username) {
      setError('Please enter your display name')
      return
    }
    if (!form.roomId.trim()) {
      setError('Please enter a 6-character room code')
      return
    }

    setLoading(true)
    try {
      const cleanCode = form.roomId.trim().toUpperCase()
      const res = await api.post('/rooms/join', {
        username,
        roomId: cleanCode,
      })
      const { room, userId, username: serverUsername, role } = res.data

      updateUsername(serverUsername)
      setGuestUser(serverUsername, userId)

      const participantSession = JSON.stringify({
        userId,
        username: serverUsername,
        role,
      })
      sessionStorage.setItem(`syncplay_room_${room.roomId}`, participantSession)
      localStorage.setItem(`syncplay_room_${room.roomId}`, participantSession)

      saveRecentRoom({
        roomId: room.roomId,
        roomName: room.roomName,
        videoId: room.videoId,
        role: role || 'participant',
      })

      navigate(`/room/${room.roomId}`)
    } catch (err) {
      console.error('Join room error:', err)
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Room not found. Please verify the code.'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#111111] text-[#FFFFFF] select-none">
      <div className="relative w-full max-w-md">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-[#181818] border border-[#242424] rounded-full px-3.5 py-1 mb-3">
            <div className="w-4 h-3 rounded-sm bg-[#FF0033] flex items-center justify-center">
              <Play size={8} fill="white" className="text-white ml-px" />
            </div>
            <span className="text-[11px] text-[#999999] font-semibold uppercase tracking-wider">Join Watch Party</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Enter Room Code</h1>
          <p className="text-xs text-[#999999] mt-1">Watch and chat together in perfect real-time sync.</p>
        </motion.div>

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
            {/* Display Name */}
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
                  placeholder="e.g. Jordan"
                  className="input-field pl-10"
                  maxLength={25}
                  required
                />
              </div>
            </div>

            {/* Room Code */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8F98B2] mb-1.5">
                6-Character Room Code
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
                <input
                  type="text"
                  name="roomId"
                  value={form.roomId}
                  onChange={handleChange}
                  placeholder="e.g. AB12CD"
                  className="input-field pl-10 font-mono tracking-widest uppercase text-base"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting to Party...</span>
                </>
              ) : (
                <>
                  <span>Join Watch Party</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Create Link */}
          <div className="mt-5 pt-4 border-t border-white/5 text-center text-xs text-[#8F98B2]">
            Want to start your own room?{' '}
            <Link to="/create" className="text-blue-400 hover:text-blue-300 font-semibold ml-1">
              Create Watch Party
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default JoinRoom
