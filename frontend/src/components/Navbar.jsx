import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Play, PlusCircle, Menu, X } from 'lucide-react'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleScrollToTutorial = () => {
    setMobileMenuOpen(false)
    if (location.pathname !== '/') {
      navigate('/#tutorial')
      setTimeout(() => {
        const el = document.getElementById('tutorial')
        el?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
    } else {
      const el = document.getElementById('tutorial')
      el?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111]/95 backdrop-blur-sm border-b border-[#242424] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#FF0033] flex items-center justify-center shadow-sm">
            <Play size={15} fill="white" className="text-white ml-0.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#FFFFFF]">
            Sync<span className="text-[#FF0033]">Play</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={handleScrollToTutorial}
            className="text-sm font-medium text-[#999999] hover:text-[#FFFFFF] transition-colors"
          >
            How to get started
          </button>
          <Link
            to="/join"
            className={`text-sm font-medium transition-colors ${
              isActive('/join') ? 'text-[#FFFFFF] font-semibold' : 'text-[#999999] hover:text-[#FFFFFF]'
            }`}
          >
            Join Party
          </Link>
          <Link
            to="/my-rooms"
            className={`text-sm font-medium transition-colors ${
              isActive('/my-rooms') ? 'text-[#FFFFFF] font-semibold' : 'text-[#999999] hover:text-[#FFFFFF]'
            }`}
          >
            My Rooms
          </Link>
          <Link
            to="/search"
            className={`text-sm font-medium transition-colors ${
              isActive('/search') ? 'text-[#FFFFFF] font-semibold' : 'text-[#999999] hover:text-[#FFFFFF]'
            }`}
          >
            Search
          </Link>
        </nav>

        {/* Right CTA Button */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/create"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#32C443] hover:bg-[#2DB33D] active:scale-95 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Create Group</span>
          </Link>
        </div>

        {/* Mobile Menu Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            to="/create"
            className="px-3 py-1.5 rounded-lg bg-[#32C443] text-white text-xs font-semibold"
          >
            Create
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#999999] hover:text-white hover:bg-[#181818] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-[#242424] bg-[#181818] px-4 py-4 space-y-3"
          >
            <button
              onClick={handleScrollToTutorial}
              className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-[#999999] hover:text-white hover:bg-[#202020] transition-colors"
            >
              How to get started
            </button>
            <Link
              to="/join"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-sm font-medium text-[#999999] hover:text-white hover:bg-[#202020] transition-colors"
            >
              Join Party
            </Link>
            <Link
              to="/my-rooms"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-sm font-medium text-[#999999] hover:text-white hover:bg-[#202020] transition-colors"
            >
              My Rooms
            </Link>
            <Link
              to="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-3 rounded-lg text-sm font-medium text-[#999999] hover:text-white hover:bg-[#202020] transition-colors"
            >
              Search Videos
            </Link>
            <div className="pt-2">
              <Link
                to="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#32C443] text-white font-semibold text-sm"
              >
                <PlusCircle size={16} />
                Create Group
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Navbar
