const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const connectToMongo = require('../db')

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
app.use('/api/auth', require('../routes/auth'))
app.use('/api/expense', require('../routes/expense'))
app.use('/api/income', require('../routes/income'))
app.use('/api/goal', require('../routes/goal'))
app.use('/api/ai', require('../routes/ai'))

app.get('/', (req, res) => {
  res.send('Backend running on Vercel 🚀')
})

const serverless = require('vercel-http')
module.exports = serverless(app)
