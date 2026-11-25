import { motion } from 'framer-motion'
import { Copy, Send, Check } from 'lucide-react'

const InviteFriendsAnimation = () => {
  return (
    <div className="relative w-full h-44 flex flex-col justify-center px-4 select-none overflow-hidden">
      <div className="relative w-full max-w-[280px] mx-auto">
        {/* Upper-Left: Small Blue Copy Link Button */}
        <motion.div
          animate={{
            scale: [1, 1, 0.94, 1, 1],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            times: [0, 0.2, 0.28, 0.36, 1],
            ease: 'easeInOut',
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2885DB] hover:bg-[#2070BC] text-white text-xs font-semibold shadow-md z-10"
        >
          <motion.div
            animate={{
              rotate: [0, -10, 10, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              times: [0, 0.25, 0.32, 0.4],
            }}
          >
            <Copy size={13} />
          </motion.div>
          <span>Copy Link</span>
        </motion.div>

        {/* Diagonal Dotted Connecting Line */}
        <svg
          className="absolute left-16 top-6 w-24 h-10 pointer-events-none z-0"
          viewBox="0 0 96 40"
          fill="none"
        >
          <motion.path
            d="M 10 5 Q 40 25 85 35"
            stroke="#2885DB"
            strokeWidth="2"
            strokeDasharray="4 4"
            animate={{
              strokeDashoffset: [0, -16],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </svg>

        {/* Lower-Right: Dark Rounded Invitation Link Field + Send Button */}
        <div className="mt-4 ml-6 flex items-center bg-[#202020] border border-[#242424] rounded-xl p-1.5 pl-3 shadow-md z-10">
          <span className="font-mono text-[11px] text-[#999999] truncate flex-1 select-none">
            syncplay.app/join/x7k9p2
          </span>

          <motion.div
            animate={{
              scale: [1, 1, 0.92, 1.1, 1],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              times: [0, 0.55, 0.62, 0.72, 1],
              ease: 'easeInOut',
            }}
            className="w-8 h-8 rounded-lg bg-[#2885DB] flex items-center justify-center text-white flex-shrink-0 shadow-sm ml-2"
          >
            <motion.div
              animate={{
                x: [0, 0, 2, -1, 0],
                y: [0, 0, -2, 1, 0],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                times: [0, 0.58, 0.65, 0.75, 1],
              }}
            >
              <Send size={14} className="ml-0.5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default InviteFriendsAnimation
