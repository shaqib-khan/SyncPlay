import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || 'localhost'
    const protocol = window.location.protocol || 'http:'
    return `${protocol}//${host}:5000`
  }
  return 'http://localhost:5000'
}

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [socketId, setSocketId] = useState(null)
  const handlersRef = useRef({})

  const getSocket = useCallback(() => {
    if (!socketRef.current) {
      socketRef.current = io(getSocketUrl(), {
        transports: ['websocket'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        autoConnect: true,
      })

      const socket = socketRef.current

      socket.on('connect', () => {
        setConnected(true)
        setSocketId(socket.id)
      })

      socket.on('disconnect', () => {
        setConnected(false)
      })

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message)
      })
    }
    return socketRef.current
  }, [])

  useEffect(() => {
    const socket = getSocket()
    return () => {
      // Don't disconnect on unmount of provider — keep alive
    }
  }, [getSocket])

  const emit = useCallback((event, data) => {
    const socket = getSocket()
    socket.emit(event, data)
  }, [getSocket])

  const on = useCallback((event, handler) => {
    const socket = getSocket()
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [getSocket])

  const off = useCallback((event, handler) => {
    const socket = getSocket()
    socket.off(event, handler)
  }, [getSocket])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [])

  const value = {
    socket: socketRef,
    connected,
    socketId,
    emit,
    on,
    off,
    disconnect,
    getSocket,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

