const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['host', 'moderator', 'participant', 'system'],
    default: 'participant',
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, 'Message too long'],
  },
  type: {
    type: String,
    enum: ['chat', 'system', 'reaction'],
    default: 'chat',
  },
  emoji: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: false })

messageSchema.index({ roomId: 1, timestamp: -1 })

module.exports = mongoose.model('Message', messageSchema)

