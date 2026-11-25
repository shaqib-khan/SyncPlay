/**
 * Extract YouTube video ID from various URL formats or plain IDs
 */
export const extractVideoId = (input) => {
  if (!input) return null
  input = input.trim()

  // Plain 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input

  try {
    const urlObj = new URL(input.startsWith('http') ? input : `https://${input}`)
    const hostname = urlObj.hostname.replace(/^www\./, '').replace(/^m\./, '')

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (urlObj.pathname === '/watch') {
        const v = urlObj.searchParams.get('v')
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      }
      const pathParts = urlObj.pathname.split('/').filter(Boolean)
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0]) && pathParts[1]) {
        const id = pathParts[1].substring(0, 11)
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id
      }
    } else if (hostname === 'youtu.be') {
      const id = urlObj.pathname.replace(/^\//, '').split(/[?#&/]/)[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id
    }
  } catch {
    // URL constructor failed, fallback to regex
  }

  const patterns = [
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) return match[1]
  }

  return null
}

export const isValidYouTubeUrl = (input) => !!extractVideoId(input)

export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') =>
  `https://img.youtube.com/vi/${videoId}/${quality}.jpg`

export const formatVideoUrl = (videoId) =>
  `https://www.youtube.com/watch?v=${videoId}`

export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export const timeAgo = (date) => {
  if (!date) return 'recently'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}

export const ROLE_PERMISSIONS = {
  host: {
    canPlay: true, canPause: true, canSeek: true,
    canChangeVideo: true, canAssignRoles: true,
    canRemoveParticipant: true, canApproveRequests: true,
    canTransferHost: true,
  },
  moderator: {
    canPlay: true, canPause: true, canSeek: true,
    canChangeVideo: true, canAssignRoles: false,
    canRemoveParticipant: false, canApproveRequests: true,
    canTransferHost: false,
  },
  participant: {
    canPlay: false, canPause: false, canSeek: false,
    canChangeVideo: false, canAssignRoles: false,
    canRemoveParticipant: false, canApproveRequests: false,
    canTransferHost: false,
  },
}

export const hasPermission = (role, permission) =>
  ROLE_PERMISSIONS[role]?.[permission] ?? false

/* ─── Watchlist Helpers ─── */
const WATCHLIST_KEY = 'syncplay_watchlist'

export const getWatchlist = () => {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const isInWatchlist = (videoId) => {
  const list = getWatchlist()
  return list.some(item => item.id === videoId)
}

export const toggleWatchlist = (video) => {
  const list = getWatchlist()
  const exists = list.some(item => item.id === video.id)
  let updated
  if (exists) {
    updated = list.filter(item => item.id !== video.id)
  } else {
    updated = [
      {
        id: video.id,
        title: video.title || 'Untitled Video',
        channel: video.channel || 'YouTube',
        views: video.views || '',
        category: video.category || 'Featured',
        savedAt: new Date().toISOString(),
      },
      ...list,
    ]
  }
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('syncplay_watchlist_updated'))
  return !exists
}

/* ─── Recent Rooms Helpers ─── */
const RECENT_ROOMS_KEY = 'syncplay_recent_rooms'

export const getRecentRooms = () => {
  try {
    const raw = localStorage.getItem(RECENT_ROOMS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const saveRecentRoom = (roomData) => {
  try {
    const list = getRecentRooms()
    const filtered = list.filter(r => r.roomId !== roomData.roomId)
    const updated = [
      {
        roomId: roomData.roomId,
        roomName: roomData.roomName || `Room ${roomData.roomId}`,
        videoId: roomData.videoId,
        role: roomData.role || 'participant',
        joinedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, 20) // Keep latest 20
    localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save recent room', e)
  }
}

export const removeRecentRoom = (roomId) => {
  const list = getRecentRooms()
  const updated = list.filter(r => r.roomId !== roomId)
  localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(updated))
  return updated
}

/* ─── Settings Helpers ─── */
const SETTINGS_KEY = 'syncplay_user_settings'

export const DEFAULT_SETTINGS = {
  syncStrictness: 'balanced', // strict (0.8s), balanced (1.5s), relaxed (3.0s)
  soundEffects: true,
  autoPlayNext: true,
  defaultResolution: '1080p',
  joinNotifications: true,
  displayName: '',
}

export const getUserSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export const saveUserSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings', e)
  }
}
