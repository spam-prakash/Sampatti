const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()

const cors = require('cors')

const connectToMongo = require('./db')

// Connect to MongoDB at startup
connectToMongo()
const PORT = 8000

// prevent model overwrite on hot reload
mongoose.models = {}
mongoose.modelSchemas = {}
mongoose.connection.models = {}

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
  origin: [
    'http://localhost:3006',
    'https://sampatti-frontend.vercel.app'
  ],
  credentials: true
}))

// connect DB once per cold start
app.use(async (req, res, next) => {
  await connectToMongo()
  next()
})

// routes (DO NOT CHANGE PREFIXES)
app.use('/api/auth', require('./routes/auth'))
app.use('/api/expense', require('./routes/expense'))
app.use('/api/income', require('./routes/income'))
app.use('/api/goal', require('./routes/goal'))
app.use('/api/ai', require('./routes/ai'))

app.get('/', (req, res) => {
  res.send('Backend running on Vercel 🚀')
})

// start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
module.exports = app
