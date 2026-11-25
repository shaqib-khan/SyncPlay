import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  PlusSquare,
  Users,
  Film,
  Bookmark,
  HelpCircle,
  Settings,
  Play
} from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: PlusSquare, label: 'Create Watch Party', path: '/create' },
  { icon: Users, label: 'Join Party', path: '/join' },
  { icon: Film, label: 'My Rooms', path: '/my-rooms' },
  { icon: Bookmark, label: 'Watchlist', path: '/watchlist' },
  { icon: HelpCircle, label: 'How It Works', path: '/#how-it-works' },
  { icon: Settings, label: 'Settings', path: '/settings' },
]

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    if (path.startsWith('/#')) return false
    return location.pathname.startsWith(path)
  }

  const handleNavClick = (path) => {
    if (path === '/#how-it-works') {
      if (location.pathname === '/') {
        const el = document.getElementById('how-it-works')
        el?.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.location.href = '/#how-it-works'
      }
    }
  }

  return (
    <>
      {/* ─── Desktop JioHotstar Sidebar ─── */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`hidden md:flex flex-col justify-between fixed left-0 top-0 bottom-0 z-50 bg-[#0F1014] border-r border-white/5 transition-all duration-200 select-none ${
          isExpanded ? 'w-[230px] shadow-2xl shadow-black/80' : 'w-[74px]'
        }`}
      >
        {/* Expanded Dark Backdrop Overlay */}
        {isExpanded && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-[#0F1014]/95 to-[#0F1014]/90 pointer-events-none -z-10" />
        )}

        {/* Top: YouTube Play Symbol Logo & SyncPlay Wordmark */}
        <div>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-5 group cursor-pointer"
          >
            {/* YouTube-style Play Symbol */}
            <div className="w-10 h-7 rounded-md bg-[#FF0000] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Play size={15} fill="white" className="text-white ml-0.5" />
            </div>

            {/* Wordmark (visible on hover) */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white">SyncPlay</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    OTT
                  </span>
                </div>
                <p className="text-[10px] text-[#8F98B2] tracking-wide">YouTube Watch Party</p>
              </motion.div>
            )}
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1 px-2.5 mt-2">
            {navItems.map(({ icon: Icon, label, path }) => {
              const active = isActive(path)

              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => handleNavClick(path)}
                  className={`group relative flex items-center gap-3.5 px-3 py-3 rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-[#8F98B2] hover:text-white hover:bg-white/5'
                  }`}
                  title={!isExpanded ? label : undefined}
                >
                  {/* JioHotstar active pill indicator on left edge */}
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-[#0F53EC] to-[#7B2CBF] rounded-r"
                    />
                  )}

                  <Icon
                    size={20}
                    className={`flex-shrink-0 transition-transform duration-150 ${
                      active ? 'text-white' : 'group-hover:scale-110'
                    }`}
                  />

                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-medium tracking-wide whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom subtle guest badge */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-2.5 px-2 py-1 text-[11px] text-[#8F98B2]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="whitespace-nowrap font-medium text-[#8F98B2]"
              >
                Instant Guest Stream
              </motion.span>
            )}
          </div>
        </div>
      </aside>

      {/* ─── Mobile Bottom Navigation Rail ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0F1014]/95 backdrop-blur-md border-t border-white/5 px-2 py-2 flex items-center justify-around select-none">
        {navItems.slice(0, 5).map(({ icon: Icon, label, path }) => {
          const active = isActive(path)

          return (
            <Link
              key={path}
              to={path}
              onClick={() => handleNavClick(path)}
              className={`flex flex-col items-center gap-1 p-1 text-[10px] font-medium transition-colors ${
                active ? 'text-blue-400' : 'text-[#8F98B2]'
              }`}
            >
              <Icon size={18} />
              <span className="truncate max-w-[50px]">{label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}

export default Sidebar
