const mongoose = require('mongoose')

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

const MONGOURI = process.env.MONGOURI

async function connectToMongo () {
  if (cached.conn) {
    // console.log('Using cached MongoDB connection ✅')
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGOURI)
      .then((mongooseInstance) => {
        console.log('MongoDB connected ✅')
        return mongooseInstance
      })
      .catch((err) => {
        console.error('MongoDB connection failed ❌', err)
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}

module.exports = connectToMongo
