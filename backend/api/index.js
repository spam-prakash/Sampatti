const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectToMongo = require('../db');

// Prevent model overwrite on hot reload
mongoose.models = {};
mongoose.modelSchemas = {};
mongoose.connection.models = {};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: [
    'http://localhost:3006',
    'https://sampatti-frontend.vercel.app'
  ],
  credentials: true
}));

// Connect to DB once per cold start (cache connection)
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectToMongo();
      dbConnected = true;
    } catch (err) {
      console.error('MongoDB connection failed:', err);
      return res.status(500).send('Database connection error');
    }
  }
  next();
}));

// Routes (do not change prefixes)
app.use('/api/auth', require('../routes/auth'));
app.use('/api/expense', require('../routes/expense'));
app.use('/api/income', require('../routes/income'));
app.use('/api/goal', require('../routes/goal'));
app.use('/api/ai', require('../routes/ai'));

// Test route
app.get('/', (req, res) => {
  res.send('Backend running on Vercel 🚀');
});

// ✅ Export Express app for Vercel serverless
module.exports = app;
