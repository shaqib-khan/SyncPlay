import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Play,
  PlusCircle,
  Users,
  Film,
  Zap,
  ShieldCheck,
  ListPlus,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import GettingStarted from '../components/GettingStarted.jsx'
import { isValidYouTubeUrl } from '../utils/helpers.js'

const Home = () => {
  const navigate = useNavigate()
  const [quickUrl, setQuickUrl] = useState('')
  const [quickRoomCode, setQuickRoomCode] = useState('')
  const [inputError, setInputError] = useState('')

  const handleQuickCreate = (e) => {
    e.preventDefault()
    setInputError('')
    if (!quickUrl.trim()) {
      navigate('/create')
      return
    }
    if (!isValidYouTubeUrl(quickUrl.trim())) {
      setInputError('Please enter a valid YouTube video URL or ID')
      return
    }
    navigate(`/create?videoUrl=${encodeURIComponent(quickUrl.trim())}`)
  }

  const handleQuickJoin = (e) => {
    e.preventDefault()
    if (!quickRoomCode.trim()) return
    navigate(`/join/${quickRoomCode.trim().toUpperCase()}`)
  }

  const scrollToTutorial = () => {
    const el = document.getElementById('tutorial')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] flex flex-col select-none">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-14 pb-20 px-4 sm:px-6 lg:px-8 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#181818] border border-[#242424] text-xs font-medium text-[#32C443] mb-6">
            <Sparkles size={14} className="text-[#32C443]" />
            <span>Zero login required · 100% Free watch party platform</span>
          </div>

          {/* GroupTube Hero Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#FFFFFF] leading-tight">
            Watch YouTube Together
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg md:text-xl text-[#999999] max-w-2xl mx-auto leading-relaxed">
            Watch videos in real-time synchronization with your friends. Chat, react, share moments, and queue up videos together seamlessly.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#32C443] hover:bg-[#2DB33D] active:scale-95 text-white font-semibold text-base transition-all shadow-sm"
            >
              <PlusCircle size={20} />
              <span>Create Group</span>
            </Link>

            <button
              onClick={scrollToTutorial}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#242424] active:scale-95 text-white font-semibold text-base transition-all"
            >
              <Play size={16} fill="white" className="text-white" />
              <span>How It Works</span>
            </button>
          </div>

          {/* Quick YouTube URL Starter Bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <form
              onSubmit={handleQuickCreate}
              className="relative flex items-center bg-[#181818] border border-[#242424] rounded-xl p-1.5 focus-within:border-[#32C443] transition-colors"
            >
              <div className="pl-3 pr-2 text-[#999999]">
                <Film size={18} />
              </div>
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => {
                  setQuickUrl(e.target.value)
                  setInputError('')
                }}
                placeholder="Paste any YouTube video link to start..."
                className="w-full bg-transparent text-sm text-[#FFFFFF] placeholder-[#999999] focus:outline-none py-2"
              />
              <button
                type="submit"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#202020] hover:bg-[#32C443] text-white text-xs font-semibold transition-colors"
              >
                <span>Start</span>
                <ArrowRight size={14} />
              </button>
            </form>
            {inputError && (
              <p className="text-xs text-red-400 mt-2 text-left px-2 font-medium">{inputError}</p>
            )}
          </div>

          {/* Quick Room Code Join Bar */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#999999]">
            <span>Have a room code?</span>
            <form onSubmit={handleQuickJoin} className="inline-flex items-center gap-1.5">
              <input
                type="text"
                value={quickRoomCode}
                onChange={(e) => setQuickRoomCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                maxLength={6}
                className="w-20 px-2 py-1 rounded-md bg-[#181818] border border-[#242424] text-white font-mono uppercase text-center text-xs focus:outline-none focus:border-[#32C443]"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md bg-[#202020] hover:bg-[#282828] text-white font-medium text-xs border border-[#242424] transition-colors"
              >
                Join
              </button>
            </form>
          </div>

          {/* Trust Highlights */}
          <div className="mt-10 pt-8 border-t border-[#242424] flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-[#999999]">
            <span className="flex items-center gap-1.5 text-white/90">
              <CheckCircle2 size={15} className="text-[#32C443]" />
              Zero Sign-Up Required
            </span>
            <span className="flex items-center gap-1.5 text-white/90">
              <CheckCircle2 size={15} className="text-[#32C443]" />
              Frame-Accurate Real-Time Sync
            </span>
            <span className="flex items-center gap-1.5 text-white/90">
              <CheckCircle2 size={15} className="text-[#32C443]" />
              Host & Moderator Controls
            </span>
            <span className="flex items-center gap-1.5 text-white/90">
              <CheckCircle2 size={15} className="text-[#32C443]" />
              Shared Queue & Live Chat
            </span>
          </div>
        </div>
      </section>

      {/* ─── Getting Started Tutorial Section (#tutorial) ─── */}
      <GettingStarted />

      {/* ─── Key Features Section ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#111111] border-t border-[#242424]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
              Everything you need for the perfect watch party
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 hover:border-[#333333] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#242424] flex items-center justify-center text-[#32C443] mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Real-Time Sync</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Play, pause, seek, and switch videos with sub-second synchronization and automatic drift recovery.
              </p>
            </div>

            <div className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 hover:border-[#333333] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#242424] flex items-center justify-center text-[#2885DB] mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Role Permissions</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Assign Moderators, manage member privileges, and approve or decline participant playback requests.
              </p>
            </div>

            <div className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 hover:border-[#333333] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#242424] flex items-center justify-center text-[#32C443] mb-4">
                <ListPlus size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">YouTube Queue</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Search YouTube right inside the room, queue upcoming videos, shuffle, and toggle smooth autoplay.
              </p>
            </div>

            <div className="bg-[#181818] border border-[#242424] rounded-[16px] p-6 hover:border-[#333333] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#242424] flex items-center justify-center text-[#2885DB] mb-4">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Group Chat & Reactions</h3>
              <p className="text-xs text-[#999999] leading-relaxed">
                Send real-time messages and trigger floating emoji reactions to share every funny or exciting moment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#111111] border-t border-[#242424] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Ready to watch together?
          </h2>
          <p className="mt-2 text-sm text-[#999999]">
            Create a private room in seconds and share the link with your friends.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#32C443] hover:bg-[#2DB33D] text-white font-semibold text-sm transition-all"
            >
              <PlusCircle size={18} />
              <span>Create Group</span>
            </Link>
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#242424] text-white font-semibold text-sm transition-all"
            >
              <Users size={18} />
              <span>Join Room</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Minimal Black Footer (NO FAQ LINKS) ─── */}
      <footer className="mt-auto border-t border-[#242424] py-8 px-4 sm:px-6 lg:px-8 bg-[#111111] text-[#999999] text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#FF0033] flex items-center justify-center">
              <Play size={11} fill="white" className="text-white ml-0.5" />
            </div>
            <span className="font-bold text-white text-sm">
              Sync<span className="text-[#FF0033]">Play</span>
            </span>
            <span className="text-[#444444] mx-1">•</span>
            <span>Real-time YouTube Watch Party</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/create" className="hover:text-white transition-colors">
              Create Group
            </Link>
            <Link to="/join" className="hover:text-white transition-colors">
              Join Party
            </Link>
            <Link to="/my-rooms" className="hover:text-white transition-colors">
              My Rooms
            </Link>
            <Link to="/search" className="hover:text-white transition-colors">
              Search
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home
