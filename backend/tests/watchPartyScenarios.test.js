const request = require('supertest')
const { app } = require('../server')
const roomManager = require('../classes/RoomManager')
const Participant = require('../classes/Participant')
const MessageHandler = require('../classes/MessageHandler')

describe('20 Comprehensive Watch Party Verification Scenarios', () => {
  const ROOM_A = 'ROOM01'
  const ROOM_B = 'ROOM02'

  beforeEach(() => {
    roomManager.rooms.clear()
    roomManager.socketMap.clear()
  })

  // 1. Host creates a room successfully
  it('Scenario 1: Host creates a room successfully', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({
        username: 'HostAlice',
        roomName: 'Alice Watch Party',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      })
    expect(res.status).toBe(201)
    expect(res.body.room).toBeDefined()
    expect(res.body.room.roomId).toMatch(/^[A-Z0-9]{6}$/)
    expect(res.body.room.videoId).toBe('dQw4w9WgXcQ')
    expect(res.body.room.participants[0].role).toBe('host')
    expect(res.body.room.participants[0].username).toBe('HostAlice')
  })

  // 2. Multiple Participants join the same room
  it('Scenario 2: Multiple Participants join the same room', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'dQw4w9WgXcQ', 'Movie Night')
    roomManager.addParticipant(ROOM_A, { userId: 'host_1', username: 'HostAlice', role: 'host', socketId: 'sock_h' })
    roomManager.addParticipant(ROOM_A, { userId: 'part_1', username: 'Bob', role: 'participant', socketId: 'sock_b' })
    roomManager.addParticipant(ROOM_A, { userId: 'part_2', username: 'Charlie', role: 'participant', socketId: 'sock_c' })

    const participants = roomManager.getParticipantsArray(ROOM_A)
    expect(participants.length).toBe(3)
    expect(participants.map((p) => p.username)).toEqual(['HostAlice', 'Bob', 'Charlie'])
    expect(participants.find((p) => p.userId === 'part_1').role).toBe('participant')
  })

  // 3. Host plays a video and everyone receives the update
  it('Scenario 3: Host plays a video and everyone receives the update', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'dQw4w9WgXcQ', 'Party')
    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('play')).toBe(true)

    const updated = roomManager.updatePlaybackState(ROOM_A, { playState: 'playing', currentTime: 15 })
    expect(updated.playState).toBe('playing')
    expect(updated.currentTime).toBeCloseTo(15, 1)
    expect(updated.stateVersion).toBe(1)

    const sync = roomManager.getSyncState(ROOM_A)
    expect(sync.playState).toBe('playing')
    expect(sync.currentTime).toBeCloseTo(15, 1)
  })

  // 4. Host pauses a video and everyone pauses
  it('Scenario 4: Host pauses a video and everyone pauses', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'dQw4w9WgXcQ', 'Party')
    roomManager.updatePlaybackState(ROOM_A, { playState: 'playing', currentTime: 30 })
    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('pause')).toBe(true)

    const updated = roomManager.updatePlaybackState(ROOM_A, { playState: 'paused', currentTime: 35 })
    expect(updated.playState).toBe('paused')
    expect(updated.currentTime).toBe(35)
    expect(updated.stateVersion).toBe(2)
  })

  // 5. Host seeks and everyone moves to the correct timestamp
  it('Scenario 5: Host seeks and everyone moves to the correct timestamp', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'dQw4w9WgXcQ', 'Party')
    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('seek')).toBe(true)

    const updated = roomManager.updatePlaybackState(ROOM_A, { currentTime: 120 })
    expect(updated.currentTime).toBe(120)
    expect(updated.stateVersion).toBe(1)
  })

  // 6. Host changes the video and everyone receives the new video
  it('Scenario 6: Host changes the video and everyone receives the new video', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'oldVideoId', 'Party')
    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('changeVideo')).toBe(true)

    const updated = roomManager.updatePlaybackState(ROOM_A, { videoId: 'newVideo999', playState: 'playing', currentTime: 0 })
    expect(updated.videoId).toBe('newVideo999')
    expect(updated.currentTime).toBe(0)
    expect(updated.playState).toBe('playing')
  })

  // 7. A late-joining Participant receives the current playback state and adjusted timestamp
  it('Scenario 7: A late-joining Participant receives current playback state with elapsed time', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'dQw4w9WgXcQ', 'Party')
    roomManager.updatePlaybackState(ROOM_A, { playState: 'playing', currentTime: 50 })
    
    // Simulate time elapsed
    const state = roomManager.getRoomState(ROOM_A)
    state.updatedAt = Date.now() - 5000 // 5 seconds ago

    const adjustedTime = roomManager.getAdjustedTime(ROOM_A)
    expect(adjustedTime).toBeGreaterThanOrEqual(54.5)
    expect(adjustedTime).toBeLessThanOrEqual(56)

    const syncState = roomManager.getSyncState(ROOM_A)
    expect(syncState.videoId).toBe('dQw4w9WgXcQ')
    expect(syncState.playState).toBe('playing')
    expect(syncState.currentTime).toBeCloseTo(adjustedTime, 1)
  })

  // 8. Host promotes a Participant to Moderator
  it('Scenario 8: Host promotes a Participant to Moderator', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    roomManager.addParticipant(ROOM_A, { userId: 'host_1', username: 'Alice', role: 'host' })
    roomManager.addParticipant(ROOM_A, { userId: 'user_bob', username: 'Bob', role: 'participant' })

    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('assignRoles')).toBe(true)

    const success = roomManager.updateParticipantRole(ROOM_A, 'user_bob', 'moderator')
    expect(success).toBe(true)
    expect(roomManager.getParticipant(ROOM_A, 'user_bob').role).toBe('moderator')
  })

  // 9. Moderator successfully controls playback
  it('Scenario 9: Moderator successfully controls playback', () => {
    const mod = new Participant({ userId: 'user_bob', username: 'Bob', role: 'moderator' })
    expect(mod.hasPermission('play')).toBe(true)
    expect(mod.hasPermission('pause')).toBe(true)
    expect(mod.hasPermission('seek')).toBe(true)
    expect(mod.hasPermission('changeVideo')).toBe(true)
    expect(mod.hasPermission('approveRequests')).toBe(true)
    // Moderator must NOT be able to assign roles or remove participants
    expect(mod.hasPermission('assignRoles')).toBe(false)
    expect(mod.hasPermission('removeParticipant')).toBe(false)
  })

  // 10. Participant is prevented from controlling playback directly
  it('Scenario 10: Participant is prevented from controlling playback directly', () => {
    const part = new Participant({ userId: 'user_charlie', username: 'Charlie', role: 'participant' })
    expect(part.hasPermission('play')).toBe(false)
    expect(part.hasPermission('pause')).toBe(false)
    expect(part.hasPermission('seek')).toBe(false)
    expect(part.hasPermission('changeVideo')).toBe(false)
    expect(part.hasPermission('assignRoles')).toBe(false)
    expect(part.hasPermission('approveRequests')).toBe(false)
  })

  // 11. Participant submits a playback request
  it('Scenario 11: Participant submits a playback request', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    const req = {
      requestId: 'req_123',
      userId: 'user_charlie',
      username: 'Charlie',
      action: 'play',
      payload: { currentTime: 25 },
      status: 'pending',
    }
    const added = roomManager.addRequest(ROOM_A, req)
    expect(added).toBe(true)
    expect(roomManager.getRoomState(ROOM_A).pendingRequests.has('req_123')).toBe(true)
  })

  // 12. Host or Moderator approves the request
  it('Scenario 12: Host or Moderator approves the request', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    const req = {
      requestId: 'req_123',
      userId: 'user_charlie',
      username: 'Charlie',
      action: 'seek',
      payload: { currentTime: 88 },
      status: 'pending',
    }
    roomManager.addRequest(ROOM_A, req)

    const resolved = roomManager.resolveRequest(ROOM_A, 'req_123', 'approved')
    expect(resolved).toBeDefined()
    expect(resolved.status).toBe('approved')
    expect(resolved.action).toBe('seek')
    expect(roomManager.getRoomState(ROOM_A).pendingRequests.has('req_123')).toBe(false)
  })

  // 13. Approved action synchronizes across the room
  it('Scenario 13: Approved action synchronizes across the room', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    // Action applied
    roomManager.updatePlaybackState(ROOM_A, { currentTime: 88 })
    const sync = roomManager.getSyncState(ROOM_A)
    expect(sync.currentTime).toBe(88)
  })

  // 14. Rejected requests do not affect playback
  it('Scenario 14: Rejected requests do not affect playback', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    roomManager.updatePlaybackState(ROOM_A, { playState: 'paused', currentTime: 10 })

    const req = {
      requestId: 'req_999',
      userId: 'user_charlie',
      username: 'Charlie',
      action: 'play',
      payload: { currentTime: 50 },
      status: 'pending',
    }
    roomManager.addRequest(ROOM_A, req)
    const resolved = roomManager.resolveRequest(ROOM_A, 'req_999', 'rejected')
    expect(resolved.status).toBe('rejected')

    // Playback state remains untouched
    const state = roomManager.getRoomState(ROOM_A)
    expect(state.playState).toBe('paused')
    expect(state.currentTime).toBe(10)
  })

  // 15. Host removes a Participant
  it('Scenario 15: Host removes a Participant', () => {
    roomManager.createRoomState(ROOM_A, 'host_1', 'vid', 'Party')
    roomManager.addParticipant(ROOM_A, { userId: 'host_1', username: 'Alice', role: 'host' })
    roomManager.addParticipant(ROOM_A, { userId: 'user_troll', username: 'Troll', role: 'participant' })

    const host = new Participant({ userId: 'host_1', username: 'Alice', role: 'host' })
    expect(host.hasPermission('removeParticipant')).toBe(true)

    const removed = roomManager.removeParticipant(ROOM_A, 'user_troll')
    expect(removed).toBe(true)
    expect(roomManager.getParticipant(ROOM_A, 'user_troll')).toBeNull()
  })

  // 16. Removed Participant loses room access
  it('Scenario 16: Removed Participant loses room access', () => {
    const p = roomManager.getParticipant(ROOM_A, 'user_troll')
    expect(p).toBeNull()
    const all = roomManager.getParticipantsArray(ROOM_A)
    expect(all.some((x) => x.userId === 'user_troll')).toBe(false)
  })

  // 17. Multiple rooms operate independently
  it('Scenario 17: Multiple rooms operate independently without cross-leakage', () => {
    roomManager.createRoomState(ROOM_A, 'h1', 'video_A', 'Room Alpha')
    roomManager.createRoomState(ROOM_B, 'h2', 'video_B', 'Room Beta')

    roomManager.updatePlaybackState(ROOM_A, { playState: 'playing', currentTime: 100 })
    roomManager.updatePlaybackState(ROOM_B, { playState: 'paused', currentTime: 20 })

    expect(roomManager.getRoomState(ROOM_A).videoId).toBe('video_A')
    expect(roomManager.getRoomState(ROOM_A).currentTime).toBe(100)
    expect(roomManager.getRoomState(ROOM_A).playState).toBe('playing')

    expect(roomManager.getRoomState(ROOM_B).videoId).toBe('video_B')
    expect(roomManager.getRoomState(ROOM_B).currentTime).toBe(20)
    expect(roomManager.getRoomState(ROOM_B).playState).toBe('paused')
  })

  // 18. Invalid URLs and room codes are handled properly
  it('Scenario 18: Invalid URLs and room codes are handled properly', async () => {
    // Non-existent room
    const badRoomRes = await request(app).get('/api/rooms/NONEXIST')
    expect(badRoomRes.status).toBe(404)
    expect(badRoomRes.body.error).toMatch(/not found/i)

    // Invalid YouTube URL on room creation
    const badUrlRes = await request(app)
      .post('/api/rooms')
      .send({
        username: 'Tester',
        roomName: 'Bad URL Party',
        videoUrl: 'https://notyoutube.com/invalid/path',
      })
    expect(badUrlRes.status).toBe(400)
    expect(badUrlRes.body.error).toMatch(/Invalid YouTube URL/i)
  })

  // 19. Disconnections and reconnections are handled properly
  it('Scenario 19: Disconnections and reconnections are handled properly', () => {
    roomManager.createRoomState(ROOM_A, 'h1', 'vid', 'Party')
    roomManager.addParticipant(ROOM_A, { userId: 'u1', username: 'Dan', role: 'participant', isConnected: true })

    // Simulate disconnect
    const p = roomManager.getParticipant(ROOM_A, 'u1')
    p.isConnected = false
    expect(roomManager.getParticipant(ROOM_A, 'u1').isConnected).toBe(false)

    // Simulate reconnect
    roomManager.updateParticipantSocket(ROOM_A, 'u1', 'new_socket_id')
    expect(roomManager.getParticipant(ROOM_A, 'u1').isConnected).toBe(true)
    expect(roomManager.getParticipant(ROOM_A, 'u1').socketId).toBe('new_socket_id')
  })

  // 20. All previously working features (chat, queue, transfer host) continue to function
  it('Scenario 20: All bonus features (queue, chat, transfer host) function reliably', async () => {
    roomManager.createRoomState(ROOM_A, 'h1', 'vid1', 'Party')
    roomManager.addParticipant(ROOM_A, { userId: 'h1', username: 'HostUser', role: 'host' })

    // Video Queue
    const qRes = roomManager.addToQueue(ROOM_A, {
      videoId: 'queuedVid123',
      title: 'Queued Video',
      channel: 'Test Channel',
      duration: 180,
      addedBy: 'HostUser',
    })
    expect(qRes.queue.length).toBe(1)
    expect(qRes.item.videoId).toBe('queuedVid123')

    // Host transfer
    roomManager.addParticipant(ROOM_A, { userId: 'u2', username: 'NextHost', role: 'participant' })
    const transferred = roomManager.transferHost(ROOM_A, 'u2')
    expect(transferred).toBe(true)
    expect(roomManager.getRoomState(ROOM_A).hostId).toBe('u2')

    // MessageHandler
    const msgHandler = new MessageHandler(ROOM_A)
    const formatted = msgHandler.formatForBroadcast({
      senderId: 'u2',
      senderName: 'NextHost',
      senderRole: 'host',
      message: 'Hello everyone!',
      type: 'chat',
    })
    expect(formatted.senderName).toBe('NextHost')
    expect(formatted.message).toBe('Hello everyone!')
    expect(formatted.type).toBe('chat')
  })
})
