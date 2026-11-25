const express = require('express')
const router = express.Router()
const { searchVideos } = require('../controllers/videoController')

router.get('/search', searchVideos)

module.exports = router

