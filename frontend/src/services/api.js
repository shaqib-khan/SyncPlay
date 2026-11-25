import axios from 'axios'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, port } = window.location
    // Standalone Vite dev/preview ports call local backend on :5000;
    // Vercel Services (and vercel dev) route /api/* on the same origin.
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && (port === '5173' || port === '4173')) {
      return `${protocol}//${hostname}:5000/api`
    }
    return '/api'
  }
  return 'http://localhost:5000/api'
}

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('syncplay_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('syncplay_token')
      localStorage.removeItem('syncplay_user')
    }
    return Promise.reject(err)
  }
)

export default api

