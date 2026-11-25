import { useState } from 'react'
import { Tv2, Film } from 'lucide-react'

const QUALITIES = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default']

/**
 * YouTubeThumbnail – Handles YouTube's thumbnail fallbacks and grey 120x90 placeholder images
 */
const YouTubeThumbnail = ({
  videoId,
  alt = 'Video thumbnail',
  className = 'w-full h-full object-cover',
  title = '',
}) => {
  const [qualityIndex, setQualityIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Handle when image successfully loads
  const handleLoad = (e) => {
    const img = e.target
    // YouTube returns a 120x90 grey letterbox placeholder image when maxres/sd does not exist
    if (img.naturalWidth === 120 && img.naturalHeight === 90 && qualityIndex < 2) {
      // It's the fake YouTube placeholder! Skip immediately to hqdefault
      setQualityIndex(2)
      return
    }
    setLoaded(true)
    setHasError(false)
  }

  // Handle image load failure
  const handleError = () => {
    if (qualityIndex < QUALITIES.length - 1) {
      setQualityIndex((prev) => prev + 1)
    } else {
      setHasError(true)
    }
  }

  if (!videoId || hasError) {
    // Professional SyncPlay Fallback Banner
    return (
      <div className="w-full h-full aspect-video bg-[#16181F] border border-white/5 flex flex-col items-center justify-center p-3 text-center relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F53EC]/10 via-transparent to-[#7B2CBF]/10 pointer-events-none" />
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8F98B2] mb-2">
          <Film size={20} />
        </div>
        <p className="text-xs font-semibold text-white line-clamp-1 max-w-[85%]">{title || 'SyncPlay Video'}</p>
        <span className="text-[10px] text-[#8F98B2] mt-0.5">Stream in Watch Room</span>
      </div>
    )
  }

  const currentSrc = `https://img.youtube.com/vi/${videoId}/${QUALITIES[qualityIndex]}.jpg`

  return (
    <div className="relative w-full h-full bg-[#101217] overflow-hidden aspect-video">
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#16181F] via-[#202532] to-[#16181F] animate-pulse" />
      )}

      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}

export default YouTubeThumbnail

