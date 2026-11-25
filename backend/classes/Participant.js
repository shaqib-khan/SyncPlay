/**
 * Participant – OOP class representing a room participant
 */
class Participant {
  constructor({ userId, username, role = 'participant', socketId = null }) {
    this.userId = userId
    this.username = username
    this.role = role
    this.socketId = socketId
    this.isConnected = !!socketId
    this.joinedAt = new Date()
  }

  hasPermission(action) {
    const permissions = {
      host: ['play', 'pause', 'seek', 'changeVideo', 'assignRoles', 'removeParticipant', 'approveRequests', 'transferHost'],
      moderator: ['play', 'pause', 'seek', 'changeVideo', 'approveRequests'],
      participant: [],
    }
    return (permissions[this.role] || []).includes(action)
  }

  promote(newRole) {
    const validRoles = ['host', 'moderator', 'participant']
    if (!validRoles.includes(newRole)) throw new Error('Invalid role')
    this.role = newRole
    return this
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      socketId: this.socketId,
      isConnected: this.isConnected,
      joinedAt: this.joinedAt,
    }
  }
}

module.exports = Participant

