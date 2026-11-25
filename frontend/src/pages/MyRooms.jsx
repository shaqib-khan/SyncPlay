import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Film, Play, Copy, Check, Trash2, Plus, Users, Tv2, ExternalLink } from 'lucide-react'
import YouTubeThumbnail from '../components/YouTubeThumbnail.jsx'
import { getRecentRooms, removeRecentRoom, copyToClipboard, timeAgo } from '../utils/helpers.js'

const MyRooms = () => {
  const [rooms, setRooms] = useState([])
  const [copiedId, setCopiedId] = useState(null)
  const [filter, setFilter] = useState('all') // all, host, participant
  const navigate = useNavigate()

  useEffect(() => {
    setRooms(getRecentRooms())
  }, [])

  const handleCopy = async (e, roomId) => {
    e.stopPropagation()
    const inviteUrl = `${window.location.origin}/join/${roomId}`
    await copyToClipboard(inviteUrl)
    setCopiedId(roomId)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleDelete = (e, roomId) => {
    e.stopPropagation()
    const updated = removeRecentRoom(roomId)
    setRooms(updated)
  }

  const filteredRooms = rooms.filter(r => {
    if (filter === 'host') return r.role === 'host'
    if (filter === 'participant') return r.role !== 'host'
    return true
  })

  return (
    <div className="min-h-screen bg-[#0F1014] text-white px-6 md:px-12 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">My Watch Rooms</h1>
          <p className="text-sm text-[#8F98B2]">Your previously hosted and joined watch parties.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/create" className="btn-primary text-xs">
            <Plus size={16} />
            Create Watch Party
          </Link>
          <Link to="/join" className="btn-secondary text-xs">
            <Users size={16} />
            Join with Code
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      {rooms.length > 0 && (
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
          {[
            { id: 'all', label: `All Rooms (${rooms.length})` },
            { id: 'host', label: `Hosted (${rooms.filter(r => r.role === 'host').length})` },
            { id: 'participant', label: `Joined (${rooms.filter(r => r.role !== 'host').length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#8F98B2] hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Rooms List */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-24 bg-[#16181F]/40 border border-white/5 rounded-2xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Film size={28} className="text-[#8F98B2]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No watch rooms yet</h3>
          <p className="text-sm text-[#8F98B2] max-w-md mx-auto mb-6">
            Whenever you create or join a watch party, it will show up here so you can quickly jump back in anytime.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/create" className="btn-primary text-xs">
              <Plus size={16} />
              Create First Party
            </Link>
            <Link to="/" className="btn-secondary text-xs">
              Explore Featured
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const isCopied = copiedId === room.roomId
            const isHost = room.role === 'host'

            return (
              <motion.div
                key={room.roomId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-[#16181F] rounded-xl border border-white/5 hover:border-white/20 p-4 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Badges */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold tracking-widest text-white px-2 py-0.5 rounded bg-white/10 border border-white/10">
                      {room.roomId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isHost ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {isHost ? 'Host' : 'Participant'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, room.roomId)}
                        className="w-7 h-7 rounded-lg text-[#8F98B2] hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors"
                        title="Remove from history"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Room Thumbnail / Preview */}
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-3">
                    {room.videoId ? (
                      <YouTubeThumbnail videoId={room.videoId} title={room.roomName} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#1C2029]">
                        <Tv2 size={24} className="text-[#8F98B2]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5 pointer-events-none">
                      <span className="text-[11px] text-[#8F98B2]">{timeAgo(room.joinedAt)}</span>
                    </div>
                  </div>

                  {/* Room Title */}
                  <h3 className="font-semibold text-sm text-white truncate mb-1" title={room.roomName}>
                    {room.roomName}
                  </h3>
                  <p className="text-xs text-[#8F98B2] truncate">Code: {room.roomId}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <button
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="btn-primary text-xs flex-1 py-2"
                  >
                    <Play size={14} fill="white" />
                    Enter Room
                  </button>
                  <button
                    onClick={(e) => handleCopy(e, room.roomId)}
                    className="btn-secondary text-xs px-3 py-2"
                    title="Copy Invite Link"
                  >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyRooms

