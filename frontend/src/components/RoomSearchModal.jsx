import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Play, Plus, Link2, Loader2, Check, Film, AlertCircle } from 'lucide-react'
import YouTubeThumbnail from './YouTubeThumbnail.jsx'
import { isValidYouTubeUrl, extractVideoId } from '../utils/helpers.js'
import api from '../services/api.js'

const RoomSearchModal = ({
  isOpen,
  onClose,
  onPlayNow,
  onAddToQueue,
  isAuthorized = false,
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('search') // 'search' | 'url'
  const [urlInput, setUrlInput] = useState('')
  const searchTimeout = useRef(null)

  // Fetch initial trending / curated items when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialVideos()
    }
  }, [isOpen])

  const loadInitialVideos = async () => {
    setLoading(true)
    try {
      const res = await api.get('/videos/search')
      setResults(res.data.results || [])
    } catch (e) {
      console.warn('Initial video load failed', e)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'search') return
    if (!query.trim()) {
      loadInitialVideos()
      return
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await api.get(`/videos/search?q=${encodeURIComponent(query.trim())}`)
        setResults(res.data.results || [])
      } catch (err) {
        console.error('Search request failed', err)
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(searchTimeout.current)
  }, [query, activeTab])

  // Handle direct URL submit
  const directVideoId = isValidYouTubeUrl(urlInput.trim()) ? extractVideoId(urlInput.trim()) : null

  const handlePlayDirect = () => {
    if (!directVideoId) return
    onPlayNow({
      videoId: directVideoId,
      title: `YouTube Video (${directVideoId})`,
      videoUrl: `https://www.youtube.com/watch?v=${directVideoId}`,
    })
    onClose()
  }

  const handleQueueDirect = () => {
    if (!directVideoId) return
    onAddToQueue({
      videoId: directVideoId,
      title: `YouTube Video (${directVideoId})`,
      videoUrl: `https://www.youtube.com/watch?v=${directVideoId}`,
    })
    setUrlInput('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#16181F] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-tight">Choose YouTube Video</h2>
            <div className="flex bg-[#1C2029] p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'search' ? 'bg-[#0F53EC] text-white' : 'text-[#8F98B2] hover:text-white'
                }`}
              >
                Search
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activeTab === 'url' ? 'bg-[#0F53EC] text-white' : 'text-[#8F98B2] hover:text-white'
                }`}
              >
                Paste URL
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8F98B2] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-b border-white/5 bg-[#1C2029]/50">
          {activeTab === 'search' ? (
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube videos by title, artist, or topic..."
                className="w-full bg-[#16181F] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-[#8F98B2] focus:outline-none focus:border-[#0F53EC]"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2] hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Link2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F98B2]" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-[#16181F] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#8F98B2] focus:outline-none focus:border-[#0F53EC]"
                  autoFocus
                />
              </div>

              {directVideoId && (
                <div className="p-3 rounded-xl bg-[#16181F] border border-green-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-20 aspect-video rounded-md overflow-hidden bg-black flex-shrink-0">
                      <YouTubeThumbnail videoId={directVideoId} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider">✓ Valid YouTube Video</span>
                      <p className="text-xs text-white mt-0.5 truncate max-w-xs">ID: {directVideoId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayDirect}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      <Play size={12} fill="white" />
                      Play Now
                    </button>
                    <button
                      onClick={handleQueueDirect}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      <Plus size={12} />
                      Queue
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-hide">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 size={28} className="animate-spin text-blue-400" />
              <p className="text-xs text-[#8F98B2]">Searching verified YouTube titles...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center text-[#8F98B2]">
              <Film size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-white">No results found</p>
              <p className="text-xs mt-1">Try another keyword or paste the YouTube link directly.</p>
            </div>
          ) : (
            results.map((video) => (
              <div
                key={video.id}
                className="group p-2.5 rounded-xl bg-[#1C2029]/60 hover:bg-[#1C2029] border border-white/5 hover:border-white/15 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                    <YouTubeThumbnail videoId={video.id} title={video.title} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-[#8F98B2] mt-0.5 truncate">
                      {video.channel} {video.duration && `· ${video.duration}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => {
                      onPlayNow({
                        videoId: video.id,
                        title: video.title,
                        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
                      })
                      onClose()
                    }}
                    className="btn-primary text-xs px-3 py-1.5"
                    title={isAuthorized ? 'Play in room now' : 'Request to play now'}
                  >
                    <Play size={12} fill="white" />
                    <span>{isAuthorized ? 'Play' : 'Request'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onAddToQueue({
                        videoId: video.id,
                        title: video.title,
                        channel: video.channel,
                        duration: video.duration,
                      })
                      onClose()
                    }}
                    className="btn-secondary text-xs px-3 py-1.5"
                    title="Add to upcoming watch queue"
                  >
                    <Plus size={13} />
                    <span>Queue</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomSearchModal

