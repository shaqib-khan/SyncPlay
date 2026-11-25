const { v4: uuidv4 } = require('uuid')
const mongoose = require('mongoose')
const Message = require('../models/Message')

// In-memory chat storage by room: Map<roomId, Array<message>>
const inMemoryMessages = new Map()

/**
 * MessageHandler – High-performance OOP class managing room chat
 * - Supports instant in-memory storage for 100% reliable real-time chat
 * - Asynchronously writes to MongoDB Atlas when connected without blocking
 * - Automatically falls back to in-memory history if MongoDB is offline
 */
class MessageHandler {
  constructor(roomId) {
    this.roomId = (roomId || '').toUpperCase()
    if (!inMemoryMessages.has(this.roomId)) {
      inMemoryMessages.set(this.roomId, [])
    }
  }

  validateMessage(text) {
    if (!text || typeof text !== 'string') return { valid: false, error: 'Message must be a string' }
    const trimmed = text.trim()
    if (trimmed.length === 0) return { valid: false, error: 'Message cannot be empty' }
    if (trimmed.length > 500) return { valid: false, error: 'Message too long (max 500 chars)' }
    return { valid: true, text: trimmed }
  }

  async saveMessage({ senderId, senderName, senderRole, message, type = 'chat', emoji = null }) {
    const validation = this.validateMessage(message)
    if (!validation.valid) throw new Error(validation.error)

    const newMsg = {
      _id: uuidv4(),
      roomId: this.roomId,
      senderId,
      senderName: senderName || 'Anonymous',
      senderRole: senderRole || 'participant',
      message: validation.text,
      type,
      emoji: emoji || null,
      timestamp: new Date().toISOString(),
    }

    // 1. Always store in memory for guaranteed real-time delivery
    const roomList = inMemoryMessages.get(this.roomId) || []
    roomList.push(newMsg)
    if (roomList.length > 200) roomList.shift() // keep last 200 messages
    inMemoryMessages.set(this.roomId, roomList)

    // 2. Asynchronously persist to MongoDB if connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      Message.create({
        roomId: this.roomId,
        senderId,
        senderName: newMsg.senderName,
        senderRole: newMsg.senderRole,
        message: newMsg.message,
        type: newMsg.type,
        emoji: newMsg.emoji,
        timestamp: new Date(),
      }).catch((dbErr) => {
        console.warn(`[Chat DB] Non-fatal DB save error for room ${this.roomId}:`, dbErr.message)
      })
    }

    return newMsg
  }

  async getHistory(limit = 100) {
    // If MongoDB is connected, attempt to fetch persistent history
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      try {
        const dbMsgs = await Message.find({ roomId: this.roomId })
          .sort({ timestamp: 1 })
          .limit(limit)
          .lean()
        if (dbMsgs && dbMsgs.length > 0) {
          return dbMsgs.map((m) => this.formatForBroadcast(m))
        }
      } catch (err) {
        console.warn(`[Chat DB] Error fetching history for room ${this.roomId}:`, err.message)
      }
    }

    // In-memory fallback
    const memoryMsgs = inMemoryMessages.get(this.roomId) || []
    return memoryMsgs.slice(-limit)
  }

  formatForBroadcast(msg) {
    return {
      _id: msg._id ? msg._id.toString() : uuidv4(),
      roomId: this.roomId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderRole: msg.senderRole || msg.role || 'participant',
      message: msg.message,
      type: msg.type || 'chat',
      emoji: msg.emoji || null,
      timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
    }
  }
}

module.exports = MessageHandler
