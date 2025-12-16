const mongoose = require('mongoose')

// Global cache for serverless (IMPORTANT)
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

const connectToMongo = async () => {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGOURI, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 5,
      minPoolSize: 1,
      family: 4,
      bufferCommands: false
    })
  }

  try {
    cached.conn = await cached.promise
    console.log('✅ MongoDB connected (serverless)')
    return cached.conn
  } catch (error) {
    cached.promise = null
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

module.exports = connectToMongo
