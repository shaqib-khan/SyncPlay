import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bookmark, Film, Play, Trash2, ArrowLeft } from 'lucide-react'
import VideoCard from '../components/VideoCard.jsx'
import { getWatchlist, toggleWatchlist } from '../utils/helpers.js'

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([])
  const navigate = useNavigate()

  const loadList = () => {
    setWatchlist(getWatchlist())
  }

  useEffect(() => {
    loadList()
  }, [])

  const handleStartParty = (videoId, title) => {
    navigate(`/create?videoUrl=https://www.youtube.com/watch?v=${videoId}&title=${encodeURIComponent(title)}`)
  }

  const handleToggle = (video) => {
    toggleWatchlist(video)
    loadList()
  }

  return (
    <div className="min-h-screen bg-[#0F1014] text-white px-6 md:px-12 py-8 select-none">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-8">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Bookmark size={18} />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                My Watchlist
              </h1>
            </div>
            <p className="text-xs text-[#8F98B2] mt-1">
              Videos saved to stream with friends in synchronized watch parties.
            </p>
          </div>

          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#8F98B2]">
            {watchlist.length} {watchlist.length === 1 ? 'Video' : 'Videos'}
          </span>
        </div>

        {/* Content */}
        {watchlist.length === 0 ? (
          <div className="text-center py-20 px-4 bg-[#16181F]/40 border border-white/5 rounded-2xl max-w-lg mx-auto">
            <Film size={36} className="mx-auto text-[#8F98B2] opacity-40 mb-3" />
            <h2 className="text-base font-bold text-white">Your Watchlist is empty</h2>
            <p className="text-xs text-[#8F98B2] mt-1 max-w-sm mx-auto mb-5 leading-relaxed">
              Explore the homepage or search for YouTube videos to save them here for future watch parties.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary text-xs px-5 py-2.5"
            >
              Explore Videos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlist.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onStartParty={handleStartParty}
                onToggleWatchlist={handleToggle}
                isWatchlisted={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Watchlist

