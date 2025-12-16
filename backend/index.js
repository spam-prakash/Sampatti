require('dotenv').config()
const connectToMongo = require('./db')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
// Clear ALL mongoose models before anything else
mongoose.models = {}
mongoose.modelSchemas = {}
mongoose.connection.models = {}

// Dynamic Port for Production/Local
const port = process.env.PORT || 8000
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Connect to MongoDB
connectToMongo()

const corsOptions = {
  origin: ['http://localhost:3006', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
}

// Use CORS middleware BEFORE your routes
app.use(cors(corsOptions))

// If you're using sessions or cookies, add these headers too
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, auth-token')
  next()
})

// Available Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/expense', require('./routes/expense'))
app.use('/api/income', require('./routes/income'))
app.use('/api/goal', require('./routes/goal'))
app.use('/api/ai', require('./routes/ai'))

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port, () => {
  console.log(`Website is running on http://localhost:${port}`)
})
