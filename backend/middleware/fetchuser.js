const jwt = require('jsonwebtoken')

if (!process.env.JWTSIGN) {
  console.error('CRITICAL: JWTSIGN environment variable is not set!')
  // You can choose to throw an error or handle it differently
  // throw new Error('JWTSIGN environment variable is required')
}

const JWT_SECRET = process.env.JWTSIGN

const fetchuser = (req, res, next) => {
  // Allow preflight requests to pass through without authentication
  if (req.method && req.method.toUpperCase() === 'OPTIONS') return next()

  // Try to get token from 'auth-token' header first, then from 'Authorization' header
  let token = req.header('auth-token') || req.header('Authorization')

  // Normalize token value (handle cases where frontends send 'undefined' or 'null')
  if (typeof token === 'string') {
    token = token.trim()
    if (token.toLowerCase() === 'undefined' || token.toLowerCase() === 'null' || token === '') {
      token = null
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Please authenticate using a valid token' })
  }

  try {
    // If token is prefixed with "Bearer ", remove the prefix
    if (token.startsWith('Bearer ')) token = token.slice(7).trim()

    const data = jwt.verify(token, JWT_SECRET)

    // Handle different token structures
    req.user = data.user || data

    // Ensure we have a user ID
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Invalid token structure' })
    }

    next()
  } catch (error) {
    // Log concise error for debugging without full stack in production
    console.error('Token verification error:', error && error.message ? error.message : error)
    return res.status(401).json({ error: 'Please authenticate using a valid token' })
  }
}

module.exports = fetchuser
