/**
 * RoomManager – OOP class managing in-memory room state
 * Keeps frequently updated playback state in memory to avoid DB writes on every seek/play/pause
 */
class RoomManager {
  constructor() {
    // Map of roomId -> room state object
    this.rooms = new Map()
    // Map of socketId -> { userId, roomId, username, role }
    this.socketMap = new Map()
  }

  createRoomState(roomId, hostId, videoId, roomName) {
    const state = {
      roomId,
      roomName,
      hostId,
      videoId,
      playState: 'paused',
      currentTime: 0,
      updatedAt: Date.now(),
      stateVersion: 0,
      participants: new Map(), // userId -> participant data
      pendingRequests: new Map(), // requestId -> request data
      queue: [], // synchronized video queue [{ queueId, videoId, title, channel, duration, addedBy }]
      autoplayNext: true, // GroupTube & WatchBuddy autoplay feature
    }
    this.rooms.set(roomId, state)
    return state
  }

  getRoomState(roomId) {
    return this.rooms.get(roomId) || null
  }

  hasRoom(roomId) {
    return this.rooms.has(roomId)
  }

  addParticipant(roomId, participant) {
    const room = this.rooms.get(roomId)
    if (!room) return false
    room.participants.set(participant.userId, { ...participant, joinedAt: Date.now() })
    return true
  }

  removeParticipant(roomId, userId) {
    const room = this.rooms.get(roomId)
    if (!room) return false
    room.participants.delete(userId)
    // Mark empty timestamp instead of immediately deleting, so a brief refresh/rejoin doesn't destroy the room
    if (room.participants.size === 0) {
      room.emptySince = Date.now()
    }
    return true
  }

  getParticipant(roomId, userId) {
    return this.rooms.get(roomId)?.participants.get(userId) || null
  }

  getParticipantsArray(roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return []
    return Array.from(room.participants.values())
  }

  updateParticipantSocket(roomId, userId, socketId) {
    const room = this.rooms.get(roomId)
    if (!room) return
    const p = room.participants.get(userId)
    if (p) {
      p.socketId = socketId
      p.isConnected = true
    }
  }

  updateParticipantRole(roomId, userId, newRole) {
    const room = this.rooms.get(roomId)
    if (!room) return false
    const p = room.participants.get(userId)
    if (!p) return false
    p.role = newRole
    return true
  }

  updatePlaybackState(roomId, { playState, currentTime, videoId } = {}) {
    const room = this.rooms.get(roomId)
    if (!room) return null
    if (playState !== undefined) room.playState = playState
    if (currentTime !== undefined) room.currentTime = currentTime
    if (videoId !== undefined) room.videoId = videoId
    room.updatedAt = Date.now()
    room.stateVersion++
    return room
  }

  /**
   * Calculate the adjusted current time for a playing video.
   * Compensates for time elapsed since last state update.
   */
  getAdjustedTime(roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return 0
    if (room.playState === 'playing') {
      const elapsed = (Date.now() - room.updatedAt) / 1000
      return room.currentTime + elapsed
    }
    return room.currentTime
  }

  getSyncState(roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return null
    return {
      roomId: room.roomId,
      videoId: room.videoId,
      playState: room.playState,
      currentTime: this.getAdjustedTime(roomId),
      stateVersion: room.stateVersion,
      hostId: room.hostId,
      autoplayNext: room.autoplayNext !== false,
      participants: this.getParticipantsArray(roomId),
      queue: this.getQueue(roomId),
      updatedAt: room.updatedAt || Date.now(),
      serverTime: Date.now(),
    }
  }

  // ---- Pending requests ----
  addRequest(roomId, request) {
    const room = this.rooms.get(roomId)
    if (!room) return false
    // Prevent duplicate pending requests from same user
    for (const [, req] of room.pendingRequests) {
      if (req.userId === request.userId && req.status === 'pending') {
        return false // Already has pending request
      }
    }
    room.pendingRequests.set(request.requestId, { ...request, status: 'pending', createdAt: Date.now() })
    return true
  }

  getRequest(roomId, requestId) {
    return this.rooms.get(roomId)?.pendingRequests.get(requestId) || null
  }

  resolveRequest(roomId, requestId, status) {
    const room = this.rooms.get(roomId)
    if (!room) return null
    const req = room.pendingRequests.get(requestId)
    if (!req || req.status !== 'pending') return null
    req.status = status
    room.pendingRequests.delete(requestId)
    return req
  }

  getPendingRequests(roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return []
    return Array.from(room.pendingRequests.values()).filter(r => r.status === 'pending')
  }

  // ---- Socket tracking ----
  registerSocket(socketId, data) {
    this.socketMap.set(socketId, data)
  }

  getSocketData(socketId) {
    return this.socketMap.get(socketId) || null
  }

  unregisterSocket(socketId) {
    const data = this.socketMap.get(socketId)
    this.socketMap.delete(socketId)
    return data
  }

  // ---- Video Queue ----
  getQueue(roomId) {
    const room = this.rooms.get(roomId)
    return room ? [...(room.queue || [])] : []
  }

  addToQueue(roomId, video) {
    const room = this.rooms.get(roomId)
    if (!room) return null
    if (!room.queue) room.queue = []
    const item = {
      queueId: video.queueId || `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      videoId: video.videoId,
      title: video.title || 'YouTube Video',
      channel: video.channel || 'YouTube',
      duration: video.duration || '',
      addedBy: video.addedBy || 'Host',
      addedAt: Date.now(),
    }
    room.queue.push(item)
    return { item, queue: [...room.queue] }
  }

  removeFromQueue(roomId, queueId) {
    const room = this.rooms.get(roomId)
    if (!room || !room.queue) return []
    room.queue = room.queue.filter(q => q.queueId !== queueId)
    return [...room.queue]
  }

  reorderQueue(roomId, fromIndex, toIndex) {
    const room = this.rooms.get(roomId)
    if (!room || !room.queue) return []
    if (fromIndex < 0 || fromIndex >= room.queue.length || toIndex < 0 || toIndex >= room.queue.length) {
      return [...room.queue]
    }
    const [moved] = room.queue.splice(fromIndex, 1)
    room.queue.splice(toIndex, 0, moved)
    return [...room.queue]
  }

  playNextInQueue(roomId) {
    const room = this.rooms.get(roomId)
    if (!room || !room.queue || room.queue.length === 0) return null
    const nextVideo = room.queue.shift()
    room.videoId = nextVideo.videoId
    room.playState = 'playing'
    room.currentTime = 0
    room.updatedAt = Date.now()
    room.stateVersion = (room.stateVersion || 0) + 1
    return {
      nextVideo,
      queue: [...room.queue],
      roomState: this.getSyncState(roomId),
    }
  }

  clearQueue(roomId) {
    const room = this.rooms.get(roomId)
    if (!room) return []
    room.queue = []
    return []
  }

  shuffleQueue(roomId) {
    const room = this.rooms.get(roomId)
    if (!room || !room.queue || room.queue.length <= 1) return room?.queue || []
    // Fisher-Yates in-place shuffle
    for (let i = room.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[room.queue[i], room.queue[j]] = [room.queue[j], room.queue[i]]
    }
    return [...room.queue]
  }

  toggleAutoplay(roomId, enabled) {
    const room = this.rooms.get(roomId)
    if (!room) return true
    if (enabled !== undefined) {
      room.autoplayNext = !!enabled
    } else {
      room.autoplayNext = !room.autoplayNext
    }
    return room.autoplayNext
  }

  transferHost(roomId, newHostId) {
    const room = this.rooms.get(roomId)
    if (!room) return false
    // Demote old host
    const oldHost = room.participants.get(room.hostId)
    if (oldHost) oldHost.role = 'participant'
    // Promote new host
    const newHost = room.participants.get(newHostId)
    if (!newHost) return false
    newHost.role = 'host'
    room.hostId = newHostId
    return true
  }
}

// Singleton instance shared across all socket handlers
module.exports = new RoomManager()

