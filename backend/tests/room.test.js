const request = require('supertest')
const { app } = require('../server')

describe('Health Check', () => {
  it('GET /api/health returns 200', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('RoomManager', () => {
  const roomManager = require('../classes/RoomManager')

  beforeEach(() => {
    roomManager.rooms.clear()
    roomManager.socketMap.clear()
  })

  it('creates a room state', () => {
    roomManager.createRoomState('TEST01', 'host123', 'videoId123', 'Test Room')
    expect(roomManager.hasRoom('TEST01')).toBe(true)
  })

  it('adds and retrieves a participant', () => {
    roomManager.createRoomState('TEST02', 'host123', 'videoId', 'Room')
    roomManager.addParticipant('TEST02', {
      userId: 'user1',
      username: 'Alice',
      role: 'host',
      socketId: 'sock1',
    })
    const p = roomManager.getParticipant('TEST02', 'user1')
    expect(p.username).toBe('Alice')
    expect(p.role).toBe('host')
  })

  it('updates playback state and increments stateVersion', () => {
    roomManager.createRoomState('TEST03', 'host123', 'vid', 'Room')
    roomManager.updatePlaybackState('TEST03', { playState: 'playing', currentTime: 42 })
    const state = roomManager.getRoomState('TEST03')
    expect(state.playState).toBe('playing')
    expect(state.currentTime).toBe(42)
    expect(state.stateVersion).toBe(1)
  })

  it('enforces role permissions', () => {
    const Participant = require('../classes/Participant')
    const host = new Participant({ userId: 'h1', username: 'Host', role: 'host' })
    const mod = new Participant({ userId: 'm1', username: 'Mod', role: 'moderator' })
    const participant = new Participant({ userId: 'p1', username: 'User', role: 'participant' })

    expect(host.hasPermission('play')).toBe(true)
    expect(host.hasPermission('assignRoles')).toBe(true)
    expect(mod.hasPermission('play')).toBe(true)
    expect(mod.hasPermission('assignRoles')).toBe(false)
    expect(participant.hasPermission('play')).toBe(false)
    expect(participant.hasPermission('changeVideo')).toBe(false)
  })

  it('transfers host role correctly', () => {
    roomManager.createRoomState('TEST04', 'h1', 'vid', 'Room')
    roomManager.addParticipant('TEST04', { userId: 'h1', username: 'Host', role: 'host' })
    roomManager.addParticipant('TEST04', { userId: 'u2', username: 'User', role: 'participant' })

    roomManager.transferHost('TEST04', 'u2')
    expect(roomManager.getParticipant('TEST04', 'u2').role).toBe('host')
    expect(roomManager.getParticipant('TEST04', 'h1').role).toBe('participant')
    expect(roomManager.getRoomState('TEST04').hostId).toBe('u2')
  })

  it('prevents duplicate pending requests', () => {
    roomManager.createRoomState('TEST05', 'h1', 'vid', 'Room')
    const req = { requestId: 'r1', userId: 'u1', action: 'play', status: 'pending' }
    expect(roomManager.addRequest('TEST05', req)).toBe(true)
    expect(roomManager.addRequest('TEST05', { ...req, requestId: 'r2' })).toBe(false)
  })

  it('manages video queue operations correctly', () => {
    roomManager.createRoomState('TEST06', 'h1', 'vid1', 'Room')
    const res1 = roomManager.addToQueue('TEST06', { videoId: 'v1', title: 'Song 1' })
    expect(res1.queue.length).toBe(1)
    expect(res1.item.title).toBe('Song 1')

    roomManager.addToQueue('TEST06', { videoId: 'v2', title: 'Song 2' })
    expect(roomManager.getQueue('TEST06').length).toBe(2)

    // Reorder
    roomManager.reorderQueue('TEST06', 1, 0)
    expect(roomManager.getQueue('TEST06')[0].videoId).toBe('v2')

    // Play next
    const next = roomManager.playNextInQueue('TEST06')
    expect(next.nextVideo.videoId).toBe('v2')
    expect(roomManager.getRoomState('TEST06').videoId).toBe('v2')
    expect(roomManager.getRoomState('TEST06').playState).toBe('playing')
    expect(next.queue.length).toBe(1)

    // Remove
    const remainingId = next.queue[0].queueId
    const afterRemove = roomManager.removeFromQueue('TEST06', remainingId)
    expect(afterRemove.length).toBe(0)

    // Autoplay & Shuffle
    expect(roomManager.toggleAutoplay('TEST06', false)).toBe(false)
    expect(roomManager.toggleAutoplay('TEST06', true)).toBe(true)

    roomManager.addToQueue('TEST06', { videoId: 'a', title: 'A' })
    roomManager.addToQueue('TEST06', { videoId: 'b', title: 'B' })
    roomManager.addToQueue('TEST06', { videoId: 'c', title: 'C' })
    const shuffled = roomManager.shuffleQueue('TEST06')
    expect(shuffled.length).toBe(3)
  })
})

