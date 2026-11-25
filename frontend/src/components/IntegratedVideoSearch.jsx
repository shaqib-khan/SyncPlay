import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Sparkles,
  Play,
  Plus,
  Loader2,
  Film,
  ExternalLink,
  Check,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import YouTubeThumbnail from './YouTubeThumbnail.jsx'
import { isValidYouTubeUrl, extractVideoId } from '../utils/helpers.js'
import api from '../services/api.js'

const IntegratedVideoSearch = ({
  onPlayNow,
  onAddToQueue,
  isAuthorized = false,
  userRole = 'participant',
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sourceInfo, setSourceInfo] = useState('')
  const [isExpanded, setIsExpanded] = useState(true)
  const [addedItemIds, setAddedItemIds] = useState(new Set())
  const debounceTimer = useRef(null)

  // Direct paste detection
  const detectedVideoId = extractVideoId(query)

  // Fetch search results from backend API
  const handleSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults([])
      setSourceInfo('')
      return
    }

    setLoading(true)
    try {
      const res = await api.get('/videos/search', {
        params: { q: searchTerm.trim() },
      })
      if (res.data?.success) {
        setResults(res.data.videos || [])
        if (res.data.source === 'youtube_api') {
          setSourceInfo('Official YouTube Data API')
        } else if (res.data.source === 'oembed') {
          setSourceInfo('Direct YouTube Video')
        } else {
          setSourceInfo('Verified Curated Catalog')
        }
      }
    } catch (err) {
      console.warn('Video search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced input change
  const handleInputChange = (e) => {
    const val = e.target.value
    setQuery(val)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      handleSearch(val)
    }, 450)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setSourceInfo('')
  }

  const handlePlayAction = (video) => {
    onPlayNow({
      videoId: video.id,
      title: video.title,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
    })
  }

  const handleQueueAction = (video) => {
    onAddToQueue({
      videoId: video.id,
      title: video.title,
      channel: video.channel,
      duration: video.duration,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
    })
    setAddedItemIds((prev) => new Set([...prev, video.id]))
    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev)
        next.delete(video.id)
        return next
      })
    }, 2500)
  }

  return (
    <div className="w-full bg-[#181818] border border-[#242424] rounded-[16px] p-4 md:p-5 shadow-sm select-none">
      {/* Header bar with collapse toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#202020] border border-[#242424] text-[#32C443] flex items-center justify-center">
            <Search size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Search & Stream YouTube</h3>
            <p className="text-[11px] text-[#999999]">Search keywords or paste any YouTube URL to stream or queue</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sourceInfo && (
            <span className="hidden sm:inline-block text-[10px] font-semibold text-[#32C443] bg-[#32C443]/15 border border-[#32C443]/30 px-2 py-0.5 rounded-full">
              {sourceInfo}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] border border-[#242424] text-[#999999] hover:text-white transition-colors"
            title={isExpanded ? 'Collapse search' : 'Expand search'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search Input Bar */}
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-[#8F98B2]" />
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search by video title, topic, or paste YouTube link (e.g. https://youtu.be/...)"
                className="input-field pl-10 pr-10 text-xs sm:text-sm py-2.5"
              />
              {loading ? (
                <Loader2 size={16} className="absolute right-3.5 text-blue-400 animate-spin" />
              ) : query ? (
                <button
                  onClick={handleClear}
                  className="absolute right-3.5 text-[#8F98B2] hover:text-white"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>

            {/* Direct URL Paste Quick Card */}
            {detectedVideoId && (
              <div className="p-3 bg-[#1C2029] border border-blue-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <YouTubeThumbnail videoId={detectedVideoId} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      Direct YouTube Link Detected
                    </span>
                    <p className="text-xs font-semibold text-white truncate">Video ID: {detectedVideoId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      handlePlayAction({
                        id: detectedVideoId,
                        title: `YouTube Video (${detectedVideoId})`,
                      })
                    }
                    className="btn-primary text-xs px-3 py-1.5"
                  >
                    <Play size={12} fill="white" />
                    <span>{isAuthorized ? 'Play Now' : 'Request Play'}</span>
                  </button>
                  <button
                    onClick={() =>
                      handleQueueAction({
                        id: detectedVideoId,
                        title: `YouTube Video (${detectedVideoId})`,
                        channel: 'YouTube',
                      })
                    }
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    <Plus size={12} />
                    <span>{isAuthorized ? 'Add to Queue' : 'Suggest Queue'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search Results Grid */}
            {results.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8F98B2]">
                  Search Results ({results.length})
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {results.map((video) => {
                    const isAdded = addedItemIds.has(video.id)

                    return (
                      <div
                        key={video.id}
                        className="p-2.5 rounded-xl bg-[#1C2029] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Thumbnail */}
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black mb-2">
                            <YouTubeThumbnail videoId={video.id} title={video.title} />
                            {video.duration && (
                              <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/80 px-1.5 py-0.5 rounded text-white">
                                {video.duration}
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <h4 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {video.title}
                          </h4>
                          <p className="text-[10px] text-[#8F98B2] truncate mt-0.5">
                            {video.channel}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handlePlayAction(video)}
                            className="flex-1 btn-primary text-xs py-1.5 px-2 justify-center"
                          >
                            <Play size={11} fill="white" />
                            <span>{isAuthorized ? 'Play Now' : 'Request'}</span>
                          </button>

                          <button
                            onClick={() => handleQueueAction(video)}
                            disabled={isAdded}
                            className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium border flex items-center justify-center gap-1 transition-all ${
                              isAdded
                                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={11} />
                                <span>Queued</span>
                              </>
                            ) : (
                              <>
                                <Plus size={11} />
                                <span>{isAuthorized ? 'Queue' : 'Suggest'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default IntegratedVideoSearch

