import { motion } from 'framer-motion'
import { Play } from 'lucide-react'

const WatchTogetherAnimation = () => {
  return (
    <div className="relative w-full h-44 flex items-center justify-center select-none overflow-hidden">
      {/* Large Centered Red YouTube Play Symbol */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          boxShadow: '0 4px 24px rgba(255, 0, 51, 0.28)',
        }}
        className="w-20 h-14 rounded-2xl bg-[#FF0033] flex items-center justify-center relative cursor-default"
      >
        {/* Subtle breathing glow */}
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.95, 1.12, 0.95],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-2xl bg-[#FF0033] filter blur-md -z-10"
        />

        {/* White Play Triangle */}
        <Play size={24} fill="white" className="text-white ml-1" />
      </motion.div>
    </div>
  )
}

export default WatchTogetherAnimation
