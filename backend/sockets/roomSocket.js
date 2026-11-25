const mongoose = require('mongoose')
const Room = require('../models/Room')
const roomManager = require('../classes/RoomManager')
const MessageHandler = require('../classes/MessageHandler')
const { v4: uuidv4 } = require('uuid')

const extractVideoId = (input) => {
  if (!input) return null
  input = input.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = input.match(p)
    if (m) return m[1]
  }
  return null
}

const PERMISSIONS = {
  host: ['play', 'pause', 'seek', 'changeVideo', 'assignRoles', 'removeParticipant', 'approveRequests', 'transferHost'],
  moderator: ['play', 'pause', 'seek', 'changeVideo', 'approveRequests'],
  participant: [],
}

const hasPermission = (role, action) => (PERMISSIONS[role] || []).includes(action)

const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`)

    // ─── JOIN ROOM ──────────────────────────────────────────────────────────
    socket.on('join_room', async ({ roomId, userId, username, role, videoId, roomName }) => {
      try {
        if (!roomId || !userId || !username) {
          return socket.emit('room_error', { message: 'Missing join parameters.' })
        }

        const upperRoomId = roomId.toUpperCase()

        // Load or create in-memory state (try DB first, fall back gracefully)
        if (!roomManager.hasRoom(upperRoomId)) {
          let dbRoom = null
          if (mongoose.connection && mongoose.connection.readyState === 1) {
            try {
              dbRoom = await Room.findOne({ roomId: upperRoomId, roomStatus: 'active' })
            } catch (dbErr) {
              console.warn('DB unavailable for join_room lookup:', dbErr.message)
            }
          }

          if (dbRoom) {
            roomManager.createRoomState(upperRoomId, dbRoom.hostId, dbRoom.videoId, dbRoom.roomName)
            // Seed participants from DB
            dbRoom.participants.forEach((p) => {
              roomManager.addParticipant(upperRoomId, {
                userId: p.userId,
                username: p.username,
                role: p.role,
                socketId: null,
                isConnected: false,
              })
            })
          } else if (role === 'host' && videoId) {
            // Host reconnecting after server restart — restore room with the host's exact videoId
            roomManager.createRoomState(upperRoomId, userId, videoId, roomName || `Room ${upperRoomId}`)
          } else {
            // Room not found in DB or memory — it was never created or server restarted.
            // Do NOT auto-create with a fake video ID. Reject so the client shows an error.
            return socket.emit('room_error', {
              message: 'Room not found. It may have expired after a server restart. Please create a new room.',
              code: 'ROOM_NOT_FOUND',
            })
          }
        }

        socket.join(upperRoomId)
        roomManager.registerSocket(socket.id, { userId, roomId: upperRoomId, username })
        roomManager.updateParticipantSocket(upperRoomId, userId, socket.id)

        // If participant not in room yet, add them
        if (!roomManager.getParticipant(upperRoomId, userId)) {
          const assignedRole = role || 'participant'
          roomManager.addParticipant(upperRoomId, {
            userId,
            username,
            role: assignedRole,
            socketId: socket.id,
            isConnected: true,
          })
        }

        const syncState = roomManager.getSyncState(upperRoomId)

        // Send current state to the newly joined user
        socket.emit('sync_state', syncState)
        socket.emit('queue_updated', { queue: syncState.queue || [] })

        // Load & send chat history
        try {
          const handler = new MessageHandler(upperRoomId)
          const history = await handler.getHistory(50)
          socket.emit('chat_history', history)
        } catch (e) { /* non-fatal */ }

        // Notify room about the new user
        io.to(upperRoomId).emit('user_joined', {
          userId,
          username,
          role: roomManager.getParticipant(upperRoomId, userId)?.role || 'participant',
          participants: syncState.participants,
        })

        console.log(`👤 ${username} joined room ${upperRoomId}`)
      } catch (err) {
        console.error('join_room error:', err)
        socket.emit('room_error', { message: 'Failed to join room.' })
      }
    })

    // ─── PLAY ───────────────────────────────────────────────────────────────
    socket.on('play', ({ roomId, currentTime }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'play')) {
        return socket.emit('room_error', { message: 'You do not have permission to play.' })
      }

      const time = typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0
        ? currentTime
        : roomManager.getAdjustedTime(ctx.roomId)

      const updated = roomManager.updatePlaybackState(ctx.roomId, {
        playState: 'playing',
        currentTime: time,
      })

      const sync = roomManager.getSyncState(ctx.roomId)
      io.to(ctx.roomId).emit('sync_state', sync)
      io.to(ctx.roomId).emit('player_play', {
        currentTime: sync.currentTime,
        stateVersion: sync.stateVersion,
        triggeredBy: ctx.userId,
        serverTime: Date.now(),
      })
    })

    // ─── PAUSE ──────────────────────────────────────────────────────────────
    socket.on('pause', ({ roomId, currentTime }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'pause')) {
        return socket.emit('room_error', { message: 'You do not have permission to pause.' })
      }

      const time = typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0
        ? currentTime
        : roomManager.getAdjustedTime(ctx.roomId)

      const updated = roomManager.updatePlaybackState(ctx.roomId, {
        playState: 'paused',
        currentTime: time,
      })

      const sync = roomManager.getSyncState(ctx.roomId)
      io.to(ctx.roomId).emit('sync_state', sync)
      io.to(ctx.roomId).emit('player_pause', {
        currentTime: sync.currentTime,
        stateVersion: sync.stateVersion,
        triggeredBy: ctx.userId,
      })
    })

    // ─── SEEK ───────────────────────────────────────────────────────────────
    socket.on('seek', (payload) => {
      const { roomId, currentTime, time } = payload || {}
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'seek')) {
        return socket.emit('room_error', { message: 'You do not have permission to seek.' })
      }

      const raw = currentTime !== undefined ? currentTime : time
      const targetTime = typeof raw === 'number' && !isNaN(raw) ? Math.max(0, raw) : 0
      roomManager.updatePlaybackState(ctx.roomId, { currentTime: targetTime })

      const sync = roomManager.getSyncState(ctx.roomId)
      io.to(ctx.roomId).emit('sync_state', sync)
      io.to(ctx.roomId).emit('player_seek', {
        currentTime: targetTime,
        time: targetTime,
        stateVersion: sync.stateVersion,
        triggeredBy: ctx.userId,
      })
    })

    // ─── CHANGE VIDEO ───────────────────────────────────────────────────────
    socket.on('change_video', async (payload) => {
      const { roomId, videoUrl, videoId } = payload || {}
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'You do not have permission to change the video.' })
      }

      const resolvedVideoId = videoId || extractVideoId(videoUrl)
      if (!resolvedVideoId) return socket.emit('room_error', { message: 'Invalid YouTube URL or Video ID.' })

      roomManager.updatePlaybackState(ctx.roomId, { videoId: resolvedVideoId, playState: 'playing', currentTime: 0 })

      // Persist to DB asynchronously
      Room.updateOne({ roomId: ctx.roomId }, { videoId: resolvedVideoId, playState: 'playing', currentTime: 0 }).catch(() => {})

      const sync = roomManager.getSyncState(ctx.roomId)
      io.to(ctx.roomId).emit('sync_state', sync)
      io.to(ctx.roomId).emit('change_video', {
        videoId: resolvedVideoId,
        currentTime: 0,
        playState: 'playing',
        stateVersion: sync.stateVersion,
        changedBy: participant.username,
      })
    })

    // ─── ASSIGN ROLE ────────────────────────────────────────────────────────
    socket.on('assign_role', async (payload) => {
      const { targetUserId: directTarget, newRole: directRole, userId, role } = payload || {}
      const targetUserId = directTarget || userId
      const newRole = directRole || role

      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const actor = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!actor || !hasPermission(actor.role, 'assignRoles')) {
        return socket.emit('room_error', { message: 'Only the host can assign roles.' })
      }

      if (!['moderator', 'participant', 'viewer'].includes(newRole)) {
        return socket.emit('room_error', { message: 'Invalid role. Can assign moderator, participant, or viewer.' })
      }

      const canonicalRole = newRole === 'viewer' ? 'participant' : newRole
      const success = roomManager.updateParticipantRole(ctx.roomId, targetUserId, canonicalRole)
      if (!success) return socket.emit('room_error', { message: 'Target participant not found.' })

      const target = roomManager.getParticipant(ctx.roomId, targetUserId)
      io.to(ctx.roomId).emit('role_assigned', {
        userId: targetUserId,
        username: target?.username,
        role: canonicalRole,
        newRole: canonicalRole,
        assignedBy: actor.username,
        participants: roomManager.getParticipantsArray(ctx.roomId),
      })

      // Persist
      Room.updateOne(
        { roomId: ctx.roomId, 'participants.userId': targetUserId },
        { $set: { 'participants.$.role': canonicalRole } }
      ).catch(() => {})
    })

    // ─── REMOVE PARTICIPANT ─────────────────────────────────────────────────
    socket.on('remove_participant', (payload) => {
      const { targetUserId: directTarget, userId } = payload || {}
      const targetUserId = directTarget || userId

      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const actor = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!actor || !hasPermission(actor.role, 'removeParticipant')) {
        return socket.emit('room_error', { message: 'Only the host can remove participants.' })
      }

      const target = roomManager.getParticipant(ctx.roomId, targetUserId)
      if (!target) return socket.emit('room_error', { message: 'Participant not found.' })
      if (target.role === 'host') return socket.emit('room_error', { message: 'Cannot remove the host.' })

      // Find and disconnect target's socket
      const targetSocket = io.sockets.sockets.get(target.socketId)
      if (targetSocket) {
        targetSocket.emit('participant_removed', { userId: targetUserId, reason: 'Removed by host.' })
        targetSocket.leave(ctx.roomId)
      }

      roomManager.removeParticipant(ctx.roomId, targetUserId)
      roomManager.unregisterSocket(target.socketId)

      io.to(ctx.roomId).emit('participant_removed', {
        userId: targetUserId,
        username: target.username,
        participants: roomManager.getParticipantsArray(ctx.roomId),
      })
    })

    // ─── REQUEST CONTROL ────────────────────────────────────────────────────
    socket.on('request_control', ({ action, payload }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const requester = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!requester) return socket.emit('room_error', { message: 'Not in a room.' })

      if (hasPermission(requester.role, action)) {
        return socket.emit('room_error', { message: 'You already have permission for this action.' })
      }

      const requestId = uuidv4()
      const request = {
        requestId,
        userId: ctx.userId,
        username: requester.username,
        action,
        payload,
        status: 'pending',
      }

      const added = roomManager.addRequest(ctx.roomId, request)
      if (!added) {
        return socket.emit('room_error', { message: 'You already have a pending request.' })
      }

      // Notify host and moderators
      const participants = roomManager.getParticipantsArray(ctx.roomId)
      participants.forEach((p) => {
        if ((p.role === 'host' || p.role === 'moderator') && p.socketId) {
          io.to(p.socketId).emit('control_requested', request)
        }
      })

      socket.emit('control_requested', { requestId, status: 'pending', message: 'Request sent to host.' })
    })

    // ─── APPROVE REQUEST ────────────────────────────────────────────────────
    socket.on('approve_request', ({ requestId }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const actor = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!actor || !hasPermission(actor.role, 'approveRequests')) {
        return socket.emit('room_error', { message: 'Not authorized to approve requests.' })
      }

      const req = roomManager.resolveRequest(ctx.roomId, requestId, 'approved')
      if (!req) return socket.emit('room_error', { message: 'Request not found or already resolved.' })

      // Apply the action
      let videoId
      switch (req.action) {
        case 'play': {
          const time = req.payload?.currentTime !== undefined ? req.payload.currentTime : roomManager.getAdjustedTime(ctx.roomId)
          roomManager.updatePlaybackState(ctx.roomId, { playState: 'playing', currentTime: time })
          const sync = roomManager.getSyncState(ctx.roomId)
          io.to(ctx.roomId).emit('sync_state', sync)
          io.to(ctx.roomId).emit('player_play', { currentTime: time, stateVersion: sync.stateVersion, triggeredBy: req.userId })
          break
        }
        case 'pause': {
          const time = req.payload?.currentTime !== undefined ? req.payload.currentTime : roomManager.getAdjustedTime(ctx.roomId)
          roomManager.updatePlaybackState(ctx.roomId, { playState: 'paused', currentTime: time })
          const sync = roomManager.getSyncState(ctx.roomId)
          io.to(ctx.roomId).emit('sync_state', sync)
          io.to(ctx.roomId).emit('player_pause', { currentTime: time, stateVersion: sync.stateVersion, triggeredBy: req.userId })
          break
        }
        case 'seek': {
          const time = req.payload?.currentTime || 0
          roomManager.updatePlaybackState(ctx.roomId, { currentTime: time })
          const sync = roomManager.getSyncState(ctx.roomId)
          io.to(ctx.roomId).emit('sync_state', sync)
          io.to(ctx.roomId).emit('player_seek', { currentTime: time, stateVersion: sync.stateVersion, triggeredBy: req.userId })
          break
        }
        case 'changeVideo': {
          videoId = extractVideoId(req.payload?.videoUrl) || req.payload?.videoId
          if (videoId) {
            roomManager.updatePlaybackState(ctx.roomId, { videoId, playState: 'playing', currentTime: 0 })
            const sync = roomManager.getSyncState(ctx.roomId)
            io.to(ctx.roomId).emit('sync_state', sync)
            io.to(ctx.roomId).emit('change_video', {
              videoId,
              currentTime: 0,
              playState: 'playing',
              stateVersion: sync.stateVersion,
              changedBy: actor.username,
            })
          }
          break
        }
        case 'add_to_queue':
          if (req.payload?.video) {
            const qRes = roomManager.addToQueue(ctx.roomId, {
              ...req.payload.video,
              addedBy: req.username,
            })
            if (qRes) {
              io.to(ctx.roomId).emit('queue_updated', {
                queue: qRes.queue,
                addedItem: qRes.item,
                message: `Suggested video "${qRes.item.title}" approved and added to queue.`,
              })
            }
          }
          break
      }

      io.to(ctx.roomId).emit('request_approved', { requestId, action: req.action, approvedBy: actor.username })

      // Notify the requester specifically
      const requester = roomManager.getParticipant(ctx.roomId, req.userId)
      if (requester?.socketId) {
        io.to(requester.socketId).emit('request_approved', { requestId, action: req.action, message: 'Your request was approved!' })
      }
    })

    // ─── REJECT REQUEST ─────────────────────────────────────────────────────
    socket.on('reject_request', ({ requestId }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const actor = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!actor || !hasPermission(actor.role, 'approveRequests')) {
        return socket.emit('room_error', { message: 'Not authorized to reject requests.' })
      }

      const req = roomManager.resolveRequest(ctx.roomId, requestId, 'rejected')
      if (!req) return socket.emit('room_error', { message: 'Request not found or already resolved.' })

      // Notify the room so all hosts and moderators clear the pending request
      io.to(ctx.roomId).emit('request_rejected', { requestId, action: req.action, rejectedBy: actor.username })

      // Notify the requester with explicit feedback message
      const requester = roomManager.getParticipant(ctx.roomId, req.userId)
      if (requester?.socketId) {
        io.to(requester.socketId).emit('request_rejected', { requestId, action: req.action, message: `Your ${req.action} request was rejected by ${actor.username}.` })
      }
    })

    // ─── SEND MESSAGE ───────────────────────────────────────────────────────
    socket.on('send_message', async (payload) => {
      try {
        const { message, emoji, type = 'chat', roomId: clientRoomId, userId: clientUserId, username: clientUsername } = payload || {}

        // Resolve context from socket mapping or client payload
        let ctx = roomManager.getSocketData(socket.id)
        let upperRoomId = (ctx?.roomId || clientRoomId || '').toUpperCase()
        let userId = ctx?.userId || clientUserId
        let username = ctx?.username || clientUsername

        if (!upperRoomId || !userId) {
          return socket.emit('room_error', { message: 'Not in a room. Please rejoin.' })
        }

        // Ensure socket is joined to room socket channel
        socket.join(upperRoomId)

        // Ensure socket mapping exists in roomManager
        if (!ctx) {
          roomManager.registerSocket(socket.id, { userId, roomId: upperRoomId, username })
          roomManager.updateParticipantSocket(upperRoomId, userId, socket.id)
        }

        let sender = roomManager.getParticipant(upperRoomId, userId)
        if (!sender) {
          // If participant record not in room state, restore it
          sender = {
            userId,
            username: username || 'Guest',
            role: 'participant',
            socketId: socket.id,
            isConnected: true,
          }
          roomManager.addParticipant(upperRoomId, sender)
        }

        const handler = new MessageHandler(upperRoomId)
        const savedMsg = await handler.saveMessage({
          senderId: userId,
          senderName: sender.username || username || 'Guest',
          senderRole: sender.role || 'participant',
          message,
          type,
          emoji,
        })

        const broadcastMsg = handler.formatForBroadcast(savedMsg)
        io.to(upperRoomId).emit('receive_message', broadcastMsg)
      } catch (err) {
        console.error('send_message error:', err.message)
        socket.emit('room_error', { message: err.message || 'Failed to send message.' })
      }
    })

    // ─── VIDEO QUEUE ────────────────────────────────────────────────────────
    socket.on('queue_add', ({ video }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant) return socket.emit('room_error', { message: 'Participant not found.' })

      const canManage = hasPermission(participant.role, 'changeVideo')
      if (!canManage) {
        // Participant suggesting a video -> route through request system
        const { v4: uuidv4 } = require('uuid')
        const requestId = uuidv4()
        const reqObj = {
          requestId,
          userId: ctx.userId,
          username: participant.username,
          action: 'add_to_queue',
          payload: { video },
        }
        const added = roomManager.addRequest(ctx.roomId, reqObj)
        if (!added) return socket.emit('room_error', { message: 'You already have a pending request.' })

        io.to(ctx.roomId).emit('control_requested', reqObj)
        return socket.emit('request_sent', { requestId, action: 'add_to_queue', message: 'Queue suggestion sent to host.' })
      }

      const res = roomManager.addToQueue(ctx.roomId, {
        ...video,
        addedBy: participant.username,
      })

      if (res) {
        io.to(ctx.roomId).emit('queue_updated', {
          queue: res.queue,
          addedItem: res.item,
          message: `${participant.username} added "${res.item.title}" to the queue.`,
        })
      }
    })

    socket.on('queue_remove', ({ queueId }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can remove queue items.' })
      }

      const updatedQueue = roomManager.removeFromQueue(ctx.roomId, queueId)
      io.to(ctx.roomId).emit('queue_updated', { queue: updatedQueue })
    })

    socket.on('queue_reorder', ({ fromIndex, toIndex }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can reorder queue.' })
      }

      const updatedQueue = roomManager.reorderQueue(ctx.roomId, fromIndex, toIndex)
      io.to(ctx.roomId).emit('queue_updated', { queue: updatedQueue })
    })

    socket.on('queue_play_next', () => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can trigger next in queue.' })
      }

      const result = roomManager.playNextInQueue(ctx.roomId)
      if (!result) {
        return socket.emit('room_error', { message: 'Queue is empty.' })
      }

      io.to(ctx.roomId).emit('change_video', {
        videoId: result.nextVideo.videoId,
        title: result.nextVideo.title,
        currentTime: 0,
        playState: 'playing',
        stateVersion: result.roomState.stateVersion,
        changedBy: participant.username,
      })

      io.to(ctx.roomId).emit('queue_updated', {
        queue: result.queue,
        nowPlaying: result.nextVideo,
      })
    })

    socket.on('queue_clear', () => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can clear the queue.' })
      }

      const updatedQueue = roomManager.clearQueue(ctx.roomId)
      io.to(ctx.roomId).emit('queue_updated', { queue: updatedQueue })
    })

    socket.on('queue_shuffle', () => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can shuffle the queue.' })
      }

      const updatedQueue = roomManager.shuffleQueue(ctx.roomId)
      io.to(ctx.roomId).emit('queue_updated', {
        queue: updatedQueue,
        message: `${participant.username} shuffled the watch queue.`,
      })
    })

    socket.on('toggle_autoplay', ({ enabled }) => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const participant = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!participant || !hasPermission(participant.role, 'changeVideo')) {
        return socket.emit('room_error', { message: 'Only host or moderator can change autoplay settings.' })
      }

      const state = roomManager.toggleAutoplay(ctx.roomId, enabled)
      io.to(ctx.roomId).emit('autoplay_toggled', { autoplayNext: state })
    })

    socket.on('request_resync', () => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return
      const syncState = roomManager.getSyncState(ctx.roomId)
      if (syncState) {
        socket.emit('sync_state', syncState)
      }
    })

    // Also handle approving 'add_to_queue' in approve_request
    // ─── TRANSFER HOST ──────────────────────────────────────────────────────
    socket.on('transfer_host', (payload) => {
      const { targetUserId: directTarget, userId } = payload || {}
      const targetUserId = directTarget || userId
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return socket.emit('room_error', { message: 'Not in a room.' })

      const actor = roomManager.getParticipant(ctx.roomId, ctx.userId)
      if (!actor || actor.role !== 'host') {
        return socket.emit('room_error', { message: 'Only the host can transfer host role.' })
      }

      const success = roomManager.transferHost(ctx.roomId, targetUserId)
      if (!success) return socket.emit('room_error', { message: 'Target participant not found.' })

      const newHost = roomManager.getParticipant(ctx.roomId, targetUserId)
      io.to(ctx.roomId).emit('host_transferred', {
        newHostId: targetUserId,
        newHostName: newHost?.username,
        previousHostId: ctx.userId,
        participants: roomManager.getParticipantsArray(ctx.roomId),
      })

      // Update DB
      Room.updateOne({ roomId: ctx.roomId }, { hostId: targetUserId }).catch(() => {})
    })

    // ─── DISCONNECT ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const ctx = roomManager.unregisterSocket(socket.id)
      if (!ctx) return

      const { userId, roomId, username } = ctx
      const participant = roomManager.getParticipant(roomId, userId)
      if (participant) {
        participant.isConnected = false
        participant.socketId = null
      }

      io.to(roomId).emit('user_left', {
        userId,
        username,
        participants: roomManager.getParticipantsArray(roomId),
      })

      console.log(`👋 ${username} left room ${roomId}`)
    })

    // ─── LEAVE ROOM ──────────────────────────────────────────────────────────
    socket.on('leave_room', () => {
      const ctx = roomManager.getSocketData(socket.id)
      if (!ctx) return
      const { userId, roomId, username } = ctx

      socket.leave(roomId)
      roomManager.removeParticipant(roomId, userId)
      roomManager.unregisterSocket(socket.id)

      io.to(roomId).emit('user_left', {
        userId,
        username,
        participants: roomManager.getParticipantsArray(roomId),
      })

      console.log(`🚪 ${username} left room ${roomId}`)
    })
  })
}

module.exports = initSocketHandlers

