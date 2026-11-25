const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGO_URI

  if (!uri || uri === 'your_mongodb_atlas_connection_string_here' || !uri.startsWith('mongodb')) {
    console.warn('⚠️  MONGO_URI not set or invalid in .env')
    console.warn('⚠️  Room metadata & chat will NOT be persisted.')
    console.warn('⚠️  Real-time sync still works via in-memory state.')
    console.warn('👉  Set MONGO_URI in backend/.env to enable full persistence.\n')
    return // Don't exit — let the WebSocket server run
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`)
    console.warn('⚠️  Continuing without database. REST endpoints that need DB will return errors.')
    // Don't exit — real-time sync still works in-memory
  }
}

module.exports = connectDB

