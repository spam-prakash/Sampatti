const express = require('express')
const cors = require('cors')
require('dotenv').config() 
const connectToMongo = require('../db')

// Prevent model overwrite on hot reload
const mongoose = require('mongoose') 
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


// Routes
app.use('/api/auth', require('../routes/auth'))
app.use('/api/expense', require('../routes/expense'))
app.use('/api/income', require('../routes/income'))
app.use('/api/goal', require('../routes/goal'))
app.use('/api/ai', require('../routes/ai'))
// Test route.
app.get('/', (req, res) => res.send('Backend running on Vercel 🚀')) 

// app.listen(8000)

// Export for Vercel
module.exports = app
