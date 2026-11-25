import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Generate an anonymous persistent guest ID
const getOrCreateGuestId = () => {
  let guestId = localStorage.getItem('syncplay_guest_id')
  if (!guestId) {
    guestId = 'guest_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4)
    localStorage.setItem('syncplay_guest_id', guestId)
  }
  return guestId
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('syncplay_user')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        // fallback
      }
    }
    const guestId = getOrCreateGuestId()
    const defaultGuest = {
      userId: guestId,
      username: localStorage.getItem('syncplay_username') || 'Guest Viewer',
      isGuest: true,
    }
    localStorage.setItem('syncplay_user', JSON.stringify(defaultGuest))
    return defaultGuest
  })

  // Update display name
  const updateUsername = useCallback((name) => {
    if (!name || !name.trim()) return
    const cleanName = name.trim()
    localStorage.setItem('syncplay_username', cleanName)
    setUser((prev) => {
      const updated = {
        ...prev,
        username: cleanName,
      }
      localStorage.setItem('syncplay_user', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Quick guest session assignment on room join/create
  const setGuestUser = useCallback((username, userId) => {
    const cleanName = username?.trim() || 'Guest Viewer'
    const cleanId = userId || getOrCreateGuestId()
    const guest = { userId: cleanId, username: cleanName, isGuest: true }
    localStorage.setItem('syncplay_user', JSON.stringify(guest))
    localStorage.setItem('syncplay_username', cleanName)
    setUser(guest)
    return guest
  }, [])

  const value = {
    user,
    userId: user?.userId,
    username: user?.username,
    isAuthenticated: true, // Always allow instant guest access
    isGuest: true,
    updateUsername,
    setGuestUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
