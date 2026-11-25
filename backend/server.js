require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const connectDB = require('./config/db')
const authRoutes = require('./routes/authRoutes')
const roomRoutes = require('./routes/roomRoutes')
const videoRoutes = require('./routes/videoRoutes')
const { errorHandler, notFound } = require('./middleware/errorMiddleware')
const initSocketHandlers = require('./sockets/roomSocket')
const rateLimit = require('express-rate-limit')

const app = express()
const server = http.createServer(app)

// Connect to MongoDB
connectDB()

// Dynamic CORS configuration allowing localhost, 127.0.0.1, LAN IPs, and CLIENT_URL
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL)
}

const isOriginAllowed = (origin) => {
  if (!origin) return true
  if (allowedOrigins.includes(origin)) return true
  // Allow any loopback or private network IP on any port in development
  if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true
  }
  return process.env.NODE_ENV !== 'production'
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api/', limiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'SyncPlay Backend',
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)
app.use('/api/videos', videoRoutes)

// 404 & error handlers
app.use(notFound)
app.use(errorHandler)

// Socket.IO setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Initialize socket event handlers
initSocketHandlers(io)

const PORT = process.env.PORT || 5000

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`\n🚀 SyncPlay backend running on port ${PORT}`)
    console.log(`📡 WebSocket server ready`)
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`)
  })
}

module.exports = { app, server }

