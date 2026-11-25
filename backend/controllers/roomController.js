const Room = require('../models/Room')
const Message = require('../models/Message')
const { body, validationResult } = require('express-validator')
const { v4: uuidv4 } = require('uuid')
const roomManager = require('../classes/RoomManager')
const mongoose = require('mongoose')

const isDBConnected = () => mongoose.connection.readyState === 1

const extractVideoId = (input) => {
  if (!input) return null
  input = input.trim()
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
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

// POST /api/rooms – create a room
const createRoom = [
  body('username').trim().isLength({ min: 1, max: 20 }).withMessage('Username required'),
  body('roomName').trim().isLength({ min: 1, max: 50 }).withMessage('Room name required'),
  body('videoUrl').notEmpty().withMessage('YouTube URL required'),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    try {
      const { username, roomName, videoUrl } = req.body
      const videoId = extractVideoId(videoUrl)
      if (!videoId) return res.status(400).json({ error: 'Invalid YouTube URL or video ID.' })

      const userId = req.user ? req.user._id.toString() : `guest_${uuidv4()}`
      const displayUsername = req.user ? req.user.username : username
      const roomId = generateRoomCode()

      const participantData = {
        userId,
        username: displayUsername,
        role: 'host',
        joinedAt: new Date(),
        isConnected: false,
      }

      // Always seed in-memory state immediately
      roomManager.createRoomState(roomId, userId, videoId, roomName)
      roomManager.addParticipant(roomId, { ...participantData, socketId: null })

      // Try to persist to DB if connected
      if (isDBConnected()) {
        try {
          // Check for roomId collision in DB
          let finalRoomId = roomId
          let dbExists = await Room.findOne({ roomId })
          let attempts = 0
          while (dbExists && attempts < 10) {
            finalRoomId = generateRoomCode()
            dbExists = await Room.findOne({ roomId: finalRoomId })
            attempts++
          }

          await Room.create({
            roomId: finalRoomId,
            roomName,
            hostId: userId,
            videoId,
            playState: 'paused',
            currentTime: 0,
            participants: [participantData],
          })

          // If the code changed, update in-memory key
          if (finalRoomId !== roomId) {
            const state = roomManager.getRoomState(roomId)
            if (state) {
              roomManager.rooms.set(finalRoomId, { ...state, roomId: finalRoomId })
              roomManager.rooms.delete(roomId)
            }
            return res.status(201).json({
              message: 'Room created successfully',
              room: { roomId: finalRoomId, roomName, videoId, hostId: userId, playState: 'paused', participants: [participantData] },
              userId,
              username: displayUsername,
            })
          }
        } catch (dbErr) {
          console.warn('DB save failed for room creation (continuing in-memory):', dbErr.message)
        }
      }

      res.status(201).json({
        message: 'Room created successfully',
        room: {
          roomId,
          roomName,
          videoId,
          hostId: userId,
          playState: 'paused',
          participants: [participantData],
        },
        userId,
        username: displayUsername,
      })
    } catch (err) {
      next(err)
    }
  },
]

// POST /api/rooms/join
const joinRoom = [
  body('username').trim().isLength({ min: 1, max: 20 }).withMessage('Username required'),
  body('roomId').trim().isLength({ min: 4, max: 8 }).withMessage('Room code required'),
  async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg })

    try {
      const { username, roomId } = req.body
      const upperRoomId = roomId.toUpperCase()

      const userId = req.user ? req.user._id.toString() : `guest_${uuidv4()}`
      const displayUsername = req.user ? req.user.username : username

      // Check in-memory first (room may have been created this session without DB)
      const inMemory = roomManager.getRoomState(upperRoomId)

      if (isDBConnected()) {
        try {
          const dbRoom = await Room.findOne({ roomId: upperRoomId, roomStatus: 'active' })
          if (!dbRoom && !inMemory) {
            return res.status(404).json({ error: 'Room not found or no longer active.' })
          }

          if (dbRoom) {
            const existingIdx = dbRoom.participants.findIndex(p => p.userId === userId)
            if (existingIdx === -1) {
              dbRoom.participants.push({
                userId,
                username: displayUsername,
                role: 'participant',
                joinedAt: new Date(),
                isConnected: false,
              })
              await dbRoom.save()
            }

            return res.json({
              message: 'Joined room successfully',
              room: {
                roomId: dbRoom.roomId,
                roomName: dbRoom.roomName,
                videoId: dbRoom.videoId,
                hostId: dbRoom.hostId,
                playState: dbRoom.playState,
                currentTime: dbRoom.currentTime,
                stateVersion: dbRoom.stateVersion,
                participants: dbRoom.participants,
              },
              userId,
              username: displayUsername,
              role: existingIdx >= 0 ? dbRoom.participants[existingIdx].role : 'participant',
            })
          }
        } catch (dbErr) {
          console.warn('DB error on joinRoom (falling back to in-memory):', dbErr.message)
        }
      }

      // Fallback: in-memory mode
      if (!inMemory) {
        return res.status(404).json({ error: 'Room not found. The room may not exist or the server restarted.' })
      }

      if (!roomManager.getParticipant(upperRoomId, userId)) {
        roomManager.addParticipant(upperRoomId, {
          userId,
          username: displayUsername,
          role: 'participant',
        })
      }

      const syncState = roomManager.getSyncState(upperRoomId)
      return res.json({
        message: 'Joined room successfully',
        room: {
          roomId: upperRoomId,
          roomName: inMemory.roomName,
          videoId: inMemory.videoId,
          hostId: inMemory.hostId,
          playState: inMemory.playState,
          currentTime: roomManager.getAdjustedTime(upperRoomId),
          stateVersion: inMemory.stateVersion,
          participants: roomManager.getParticipantsArray(upperRoomId),
        },
        userId,
        username: displayUsername,
        role: 'participant',
      })
    } catch (err) {
      next(err)
    }
  },
]

// GET /api/rooms/:roomId
const getRoom = async (req, res, next) => {
  try {
    const upperRoomId = req.params.roomId.toUpperCase()

    if (isDBConnected()) {
      try {
        const room = await Room.findOne({ roomId: upperRoomId })
        if (room) return res.json({ room })
      } catch (dbErr) {
        console.warn('DB error on getRoom:', dbErr.message)
      }
    }

    // Fallback: in-memory
    const inMemory = roomManager.getRoomState(upperRoomId)
    if (!inMemory) return res.status(404).json({ error: 'Room not found.' })

    res.json({
      room: {
        roomId: upperRoomId,
        roomName: inMemory.roomName,
        hostId: inMemory.hostId,
        videoId: inMemory.videoId,
        playState: inMemory.playState,
        currentTime: roomManager.getAdjustedTime(upperRoomId),
        stateVersion: inMemory.stateVersion,
        participants: roomManager.getParticipantsArray(upperRoomId),
        roomStatus: 'active',
      },
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/rooms/:roomId/participants
const getParticipants = async (req, res, next) => {
  try {
    const upperRoomId = req.params.roomId.toUpperCase()

    if (isDBConnected()) {
      try {
        const room = await Room.findOne({ roomId: upperRoomId })
        if (room) return res.json({ participants: room.participants })
      } catch (dbErr) {
        console.warn('DB error on getParticipants:', dbErr.message)
      }
    }

    const participants = roomManager.getParticipantsArray(upperRoomId)
    res.json({ participants })
  } catch (err) {
    next(err)
  }
}

// GET /api/rooms/:roomId/messages
const getMessages = async (req, res, next) => {
  try {
    if (isDBConnected()) {
      const messages = await Message.find({ roomId: req.params.roomId.toUpperCase() })
        .sort({ timestamp: 1 })
        .limit(100)
      return res.json({ messages })
    }
    // No DB — return empty (chat history not persisted in memory mode)
    res.json({ messages: [] })
  } catch (err) {
    next(err)
  }
}

module.exports = { createRoom, joinRoom, getRoom, getParticipants, getMessages }
