import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, X, Play, Plus, Check, Tv2, Sparkles, Link2, Loader2 } from 'lucide-react'
import YouTubeThumbnail from '../components/YouTubeThumbnail.jsx'
import { CATEGORIES } from '../utils/videoData.js'
import { isValidYouTubeUrl, extractVideoId, toggleWatchlist, isInWatchlist } from '../utils/helpers.js'
import api from '../services/api.js'

const ALL_LOCAL_VIDEOS = Array.from(
  new Map(CATEGORIES.flatMap(c => c.videos).map(v => [v.id, v])).values()
)

const CHIPS = ['All', 'Featured', 'Popular', 'Music', 'Gaming', 'Entertainment', 'Technology', 'Documentaries']

const SearchPage = () => {
  const [query, setQuery] = useState('')
  const [selectedChip, setSelectedChip] = useState('All')
  const [watchlistVersion, setWatchlistVersion] = useState(0)
  const [apiResults, setApiResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const searchTimeout = useRef(null)

  const isCustomUrl = isValidYouTubeUrl(query.trim())
  const customId = isCustomUrl ? extractVideoId(query.trim()) : null

  // Fetch search from backend API
  useEffect(() => {
    if (!query.trim() || isCustomUrl) {
      setApiResults(null)
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/videos/search?q=${encodeURIComponent(query.trim())}`)
        setApiResults(res.data.results || [])
      } catch {
        setApiResults(null)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(searchTimeout.current)
  }, [query, isCustomUrl])

  const displayedVideos = useMemo(() => {
    if (apiResults && apiResults.length > 0) {
      if (selectedChip === 'All') return apiResults
      return apiResults.filter(v => (v.category || '').toLowerCase().includes(selectedChip.toLowerCase()))
    }

    let list = ALL_LOCAL_VIDEOS
    if (selectedChip !== 'All') {
      list = list.filter(v => v.category?.toLowerCase() === selectedChip.toLowerCase())
    }
    if (query.trim() && !isCustomUrl) {
      const q = query.toLowerCase()
      list = list.filter(
        v => v.title.toLowerCase().includes(q) ||
             v.channel.toLowerCase().includes(q) ||
             v.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [apiResults, selectedChip, query, isCustomUrl])

  const handleStartWatchParty = (videoId, title) => {
    navigate(`/create?videoUrl=https://www.youtube.com/watch?v=${videoId}&title=${encodeURIComponent(title || 'Watch Party')}`)
  }

  const handleToggleWatchlist = (video) => {
    toggleWatchlist(video)
    setWatchlistVersion(v => v + 1)
  }

  return (
    <div className="min-h-screen bg-[#0F1014] text-white px-6 md:px-12 py-8 max-w-7xl mx-auto">
      {/* Search Header */}
      <div className="mb-8 max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">Search & Explore</h1>
        <p className="text-sm text-[#8F98B2]">Search verified YouTube videos or paste any direct YouTube link.</p>

        {/* Search Bar */}
        <div className="relative mt-5">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, artists, games or paste YouTube link..."
            className="w-full bg-[#16181F] border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-[#8F98B2] focus:outline-none focus:border-[#0F53EC] focus:ring-1 focus:ring-[#0F53EC] text-base transition-all"
            autoFocus
          />
          {loading && (
            <Loader2 size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
          )}
          {query && (
            <button
              onClick={() => { setQuery(''); setApiResults(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8F98B2] hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-hide">
          {CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedChip === chip
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/5 text-[#8F98B2] hover:text-white hover:bg-white/10'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Direct YouTube Link Box (if valid link typed) */}
      {isCustomUrl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-[#1C2029] border border-[#0F53EC]/40 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
              <YouTubeThumbnail videoId={customId} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">Valid Link</span>
                <span className="text-xs text-[#8F98B2]">ID: {customId}</span>
              </div>
              <p className="text-sm font-semibold text-white mt-1 truncate max-w-md">Ready to start Watch Party with this link</p>
            </div>
          </div>
          <button
            onClick={() => handleStartWatchParty(customId, 'Custom YouTube Party')}
            className="btn-primary w-full sm:w-auto flex-shrink-0"
          >
            <Play size={16} fill="white" />
            Start Party Now
          </button>
        </motion.div>
      )}

      {/* Results Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider text-[#8F98B2] font-semibold">
            {displayedVideos.length} {displayedVideos.length === 1 ? 'Video' : 'Videos'} Found
          </p>
        </div>

        {displayedVideos.length === 0 ? (
          <div className="text-center py-20 bg-[#16181F]/40 border border-white/5 rounded-2xl">
            <Tv2 size={40} className="mx-auto text-[#8F98B2] mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-white mb-1">No videos found</h3>
            <p className="text-sm text-[#8F98B2] max-w-md mx-auto mb-6">
              Try searching for another artist, game, or title, or paste a YouTube video link directly.
            </p>
            <button
              onClick={() => { setQuery(''); setSelectedChip('All'); setApiResults(null); }}
              className="btn-secondary text-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedVideos.map((video) => {
              const inList = isInWatchlist(video.id)
              return (
                <div
                  key={video.id}
                  className="group bg-[#16181F] rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-black overflow-hidden">
                    <YouTubeThumbnail videoId={video.id} title={video.title} />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleStartWatchParty(video.id, video.title)}
                        className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0F53EC] to-[#7B2CBF] flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform"
                        title="Start Watch Party"
                      >
                        <Play size={18} fill="white" className="ml-0.5" />
                      </button>
                      <button
                        onClick={() => handleToggleWatchlist(video)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                          inList ? 'bg-white text-black border-white' : 'bg-black/60 text-white border-white/30 hover:bg-white/20'
                        }`}
                        title={inList ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      >
                        {inList ? <Check size={16} /> : <Plus size={16} />}
                      </button>
                    </div>

                    {video.duration && (
                      <span className="absolute bottom-1.5 right-1.5 text-[10px] font-semibold bg-black/80 text-white px-1.5 py-0.5 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                        {video.title}
                      </h4>
                      <p className="text-[11px] text-[#8F98B2] mt-1 truncate">{video.channel}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] text-[#8F98B2]">
                      <span className="capitalize">{video.category || 'YouTube'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
