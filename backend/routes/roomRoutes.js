const express = require('express')
const router = express.Router()
const { createRoom, joinRoom, getRoom, getParticipants, getMessages } = require('../controllers/roomController')
const { optionalAuth } = require('../middleware/authMiddleware')

router.post('/', optionalAuth, createRoom)
router.post('/join', optionalAuth, joinRoom)
router.get('/:roomId', getRoom)
router.get('/:roomId/participants', getParticipants)
router.get('/:roomId/messages', getMessages)

module.exports = router

