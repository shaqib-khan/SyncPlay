import { io } from 'socket.io-client'

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, port, origin } = window.location
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '5173' || port === '4173')) {
      return `${protocol}//${hostname}:5000`
    }
    return origin
  }
  return 'http://localhost:5000'
}

const SOCKET_URL = getSocketUrl()

let socketInstance = null

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect()
    socketInstance = null
  }
}

export default { getSocket, disconnectSocket }

