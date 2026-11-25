import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'

const CreatePartyAnimation = () => {
  return (
    <div className="relative w-full h-44 flex items-center justify-center select-none overflow-hidden">
      {/* Pill-shaped Green Create Group Button */}
      <motion.div
        animate={{
          scale: [1, 1, 0.94, 1, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          times: [0, 0.42, 0.5, 0.58, 1],
          ease: 'easeInOut',
        }}
        style={{
          boxShadow: '0 0 20px rgba(50, 196, 67, 0.35)',
        }}
        className="relative z-10 px-7 py-3 rounded-full bg-[#32C443] flex items-center gap-2 text-white font-bold text-sm tracking-wide shadow-lg"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Create Group</span>

        {/* Subtle click ripple/glow burst */}
        <motion.div
          animate={{
            scale: [0.8, 1.3, 1.5],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            times: [0, 0.5, 0.7],
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full border border-white/60 pointer-events-none"
        />
      </motion.div>

      {/* Pointing-Hand Cursor moving towards the button and clicking */}
      <motion.div
        animate={{
          x: [40, 40, 0, 0, 40],
          y: [40, 40, 8, 8, 40],
          scale: [1, 1, 0.88, 1, 1],
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          times: [0, 0.15, 0.48, 0.56, 1],
          ease: 'easeInOut',
        }}
        className="absolute z-20 pointer-events-none"
      >
        {/* Hand Cursor SVG */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="white"
          stroke="#111111"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
        >
          <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
          <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
          <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
          <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
        </svg>
      </motion.div>
    </div>
  )
}

export default CreatePartyAnimation
