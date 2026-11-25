import { memo } from 'react'
import { Play, Plus, Check } from 'lucide-react'
import YouTubeThumbnail from './YouTubeThumbnail.jsx'

const VideoCard = memo(({ video, onStartParty, onToggleWatchlist, isWatchlisted }) => {
  return (
    <div
      onClick={() => onStartParty(video.id, video.title)}
      className="flex-shrink-0 w-48 sm:w-56 md:w-64 cursor-pointer group rounded-lg overflow-hidden bg-[#16181F] border border-white/5 hover:border-white/20 transition-all duration-200 select-none"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <YouTubeThumbnail videoId={video.id} title={video.title} />

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-2.5">
          {/* Top: Watchlist Toggle */}
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleWatchlist(video)
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                isWatchlisted
                  ? 'bg-white text-black border-white'
                  : 'bg-black/60 text-white border-white/30 hover:bg-white/20'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isWatchlisted ? <Check size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {/* Bottom: Watch Party Action */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-[#0F53EC] to-[#7B2CBF] px-2.5 py-1 rounded-md shadow">
              <Play size={12} fill="white" />
              Watch Party
            </span>
          </div>
        </div>

        {/* Duration Tag */}
        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold bg-black/80 text-white px-1.5 py-0.5 rounded">
            {video.duration}
          </span>
        )}
      </div>

      {/* Video Details */}
      <div className="p-3">
        <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
          {video.title}
        </h3>
        <p className="text-[11px] text-[#8F98B2] mt-0.5 truncate">
          {video.channel || 'YouTube'}
        </p>
      </div>
    </div>
  )
})

VideoCard.displayName = 'VideoCard'

export default VideoCard

