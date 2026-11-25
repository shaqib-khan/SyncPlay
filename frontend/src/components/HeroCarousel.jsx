import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Users, Plus, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { HERO_CAROUSEL_ITEMS } from '../utils/videoData.js'

const HeroCarousel = ({ onStartParty, onToggleWatchlist, isInWatchlist }) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-advance hero carousel every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_CAROUSEL_ITEMS.length)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  const currentHero = HERO_CAROUSEL_ITEMS[currentSlide]
  const isHeroInWatchlist = isInWatchlist(currentHero.id)

  return (
    <section className="relative w-full h-[68vh] min-h-[460px] max-h-[720px] bg-[#0F1014] overflow-hidden select-none">
      {/* Background Hero Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentHero.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src={`https://img.youtube.com/vi/${currentHero.id}/maxresdefault.jpg`}
            alt={currentHero.title}
            className="w-full h-full object-cover object-center"
            onLoad={(e) => {
              if (e.target.naturalWidth === 120 && e.target.naturalHeight === 90) {
                e.target.src = `https://img.youtube.com/vi/${currentHero.id}/hqdefault.jpg`
              }
            }}
            onError={(e) => {
              e.target.src = `https://img.youtube.com/vi/${currentHero.id}/hqdefault.jpg`
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1014] via-[#0F1014]/85 to-transparent w-full md:w-[70%]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0F1014] via-[#0F1014]/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0F1014]/60 to-transparent" />

      {/* Hero Content Information */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 md:px-12 pb-14 max-w-4xl">
        <motion.div
          key={`content-${currentHero.id}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            <span className="bg-gradient-to-r from-[#0F53EC] to-[#7B2CBF] text-white font-extrabold uppercase tracking-wider px-2 py-0.5 rounded text-[10px]">
              {currentHero.badge}
            </span>
            <span className="text-[#8F98B2] font-medium">{currentHero.genre}</span>
            <span className="text-[#8F98B2]">·</span>
            <span className="text-[#8F98B2]">{currentHero.duration}</span>
            <span className="text-[#8F98B2]">·</span>
            <span className="text-[#8F98B2]">{currentHero.views}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-3">
            {currentHero.title}
          </h1>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#8F98B2] line-clamp-2 sm:line-clamp-3 max-w-2xl leading-relaxed mb-6">
            {currentHero.description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onStartParty(currentHero.id, currentHero.title)}
              className="btn-primary text-sm px-6 py-3"
            >
              <Play size={18} fill="white" />
              <span>Create Watch Party</span>
            </button>

            <Link to="/join" className="btn-secondary text-sm px-5 py-3">
              <Users size={18} />
              <span>Join Party</span>
            </Link>

            <button
              onClick={() => onToggleWatchlist(currentHero)}
              className={`btn-secondary text-sm px-4 py-3 ${
                isHeroInWatchlist ? 'text-white border-white/30' : ''
              }`}
              title={isHeroInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              {isHeroInWatchlist ? (
                <>
                  <Check size={18} className="text-green-400" />
                  <span>In Watchlist</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Watchlist</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Carousel Navigation Indicators */}
      <div className="absolute right-6 md:right-12 bottom-8 z-20 flex items-center gap-1.5">
        {HERO_CAROUSEL_ITEMS.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === idx
                ? 'w-8 bg-gradient-to-r from-[#0F53EC] to-[#7B2CBF]'
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Side Chevrons */}
      <button
        onClick={() =>
          setCurrentSlide(
            (prev) => (prev - 1 + HERO_CAROUSEL_ITEMS.length) % HERO_CAROUSEL_ITEMS.length
          )
        }
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0F1014]/60 border border-white/10 items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 hover:opacity-100"
        aria-label="Previous slide"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        onClick={() =>
          setCurrentSlide((prev) => (prev + 1) % HERO_CAROUSEL_ITEMS.length)
        }
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#0F1014]/60 border border-white/10 items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 hover:opacity-100"
        aria-label="Next slide"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  )
}

export default HeroCarousel

