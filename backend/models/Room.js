const mongoose = require('mongoose')

const participantSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  role: { type: String, enum: ['host', 'moderator', 'participant'], default: 'participant' },
  socketId: { type: String },
  joinedAt: { type: Date, default: Date.now },
  isConnected: { type: Boolean, default: true },
}, { _id: false })

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  roomName: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [50, 'Room name too long'],
  },
  hostId: {
    type: String,
    required: true,
  },
  videoId: {
    type: String,
    default: 'dQw4w9WgXcQ', // Default Rick Roll as placeholder
  },
  videoTitle: {
    type: String,
    default: '',
  },
  playState: {
    type: String,
    enum: ['playing', 'paused'],
    default: 'paused',
  },
  currentTime: {
    type: Number,
    default: 0,
  },
  stateVersion: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  participants: [participantSchema],
  roomStatus: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true })

// Index for fast lookup (roomId already unique in schema definition)
roomSchema.index({ hostId: 1 })
roomSchema.index({ roomStatus: 1 })

module.exports = mongoose.model('Room', roomSchema)
