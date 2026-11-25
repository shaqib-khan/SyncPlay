import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Sliders, Volume2, Shield, Trash2, RotateCcw, Check, Monitor } from 'lucide-react'
import { getUserSettings, saveUserSettings, DEFAULT_SETTINGS } from '../utils/helpers.js'

const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    setSettings(getUserSettings())
  }, [])

  const update = (key, value) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)
    saveUserSettings(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearHistory = () => {
    if (window.confirm('Clear all your recent watch rooms history?')) {
      localStorage.removeItem('syncplay_recent_rooms')
      setFeedback('Recent watch rooms cleared')
      setTimeout(() => setFeedback(''), 2500)
    }
  }

  const handleClearWatchlist = () => {
    if (window.confirm('Clear your entire watchlist?')) {
      localStorage.removeItem('syncplay_watchlist')
      setFeedback('Watchlist cleared')
      setTimeout(() => setFeedback(''), 2500)
    }
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset all preferences to default?')) {
      setSettings(DEFAULT_SETTINGS)
      saveUserSettings(DEFAULT_SETTINGS)
      setFeedback('Preferences reset to defaults')
      setTimeout(() => setFeedback(''), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1014] text-white px-6 md:px-12 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Preferences & Settings</h1>
          <p className="text-sm text-[#8F98B2]">Tune your SyncPlay streaming, synchronization, and audio experience.</p>
        </div>
        {(saved || feedback) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full"
          >
            <Check size={14} />
            <span>{feedback || 'Saved'}</span>
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        {/* Playback & Sync Strictness */}
        <div className="bg-[#16181F] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Synchronization Strictness</h3>
              <p className="text-xs text-[#8F98B2]">Controls drift tolerance between participants and host.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'strict', label: 'Strict (0.8s)', desc: 'Exact real-time lock. Frequent micro-seeks on slow networks.' },
              { id: 'balanced', label: 'Balanced (1.5s)', desc: 'Recommended. Smooth playback with minimal drift.' },
              { id: 'relaxed', label: 'Relaxed (3.0s)', desc: 'Best for slower internet connections and mobile networks.' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => update('syncStrictness', item.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  settings.syncStrictness === item.id
                    ? 'bg-[#1C2029] border-[#0F53EC] shadow-md'
                    : 'bg-[#1C2029]/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{item.label}</span>
                  {settings.syncStrictness === item.id && <Check size={14} className="text-[#0F53EC]" />}
                </div>
                <p className="text-[11px] text-[#8F98B2] leading-relaxed">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Video Quality & Autoplay */}
        <div className="bg-[#16181F] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Monitor size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Streaming & Player</h3>
              <p className="text-xs text-[#8F98B2]">YouTube player initialization and autoplay behavior.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Auto-Play Next in Room</p>
                <p className="text-xs text-[#8F98B2]">Automatically queue recommendation when current video completes.</p>
              </div>
              <button
                onClick={() => update('autoPlayNext', !settings.autoPlayNext)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.autoPlayNext ? 'bg-[#0F53EC]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.autoPlayNext ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">Preferred Default Resolution</p>
                <p className="text-xs text-[#8F98B2]">Initial quality requested from the YouTube Player API.</p>
              </div>
              <select
                value={settings.defaultResolution}
                onChange={(e) => update('defaultResolution', e.target.value)}
                className="bg-[#1C2029] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#0F53EC]"
              >
                <option value="auto">Auto (Adaptive)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audio & Notifications */}
        <div className="bg-[#16181F] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Volume2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Sounds & Alerts</h3>
              <p className="text-xs text-[#8F98B2]">Auditory feedback during real-time watch party chat and events.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <p className="text-sm font-medium text-white">Chat Notification Chimes</p>
                <p className="text-xs text-[#8F98B2]">Subtle chime when a participant sends a new chat message.</p>
              </div>
              <button
                onClick={() => update('soundEffects', !settings.soundEffects)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.soundEffects ? 'bg-[#0F53EC]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.soundEffects ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">Participant Join Alerts</p>
                <p className="text-xs text-[#8F98B2]">Notice when a friend joins or leaves the room.</p>
              </div>
              <button
                onClick={() => update('joinNotifications', !settings.joinNotifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  settings.joinNotifications ? 'bg-[#0F53EC]' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.joinNotifications ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Storage & Data Management */}
        <div className="bg-[#16181F] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
              <Trash2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Data & Local Storage</h3>
              <p className="text-xs text-[#8F98B2]">Manage your cached rooms and locally saved preferences.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleClearHistory}
              className="btn-secondary text-xs hover:border-red-500/40 hover:text-red-300"
            >
              <Trash2 size={14} />
              Clear Recent Rooms
            </button>
            <button
              onClick={handleClearWatchlist}
              className="btn-secondary text-xs hover:border-red-500/40 hover:text-red-300"
            >
              <Trash2 size={14} />
              Clear Watchlist
            </button>
            <button
              onClick={handleResetDefaults}
              className="btn-secondary text-xs"
            >
              <RotateCcw size={14} />
              Reset Settings to Default
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings

