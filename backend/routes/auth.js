const express = require('express')
const User = require('../123/User')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const sendMail = require('./mailer')
const otpGenerator = require('otp-generator')
const crypto = require('crypto')
const { OAuth2Client } = require('google-auth-library')
const AIAnalyzer = require('../services/AIAnalyzer')
const AITriggerService = require('../services/AITriggerService')
const fetchuser = require('../middleware/fetchuser')

const JWT_SECRET = process.env.JWTSIGN
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

// Store OTPs temporarily
const otpStore = {}
const resetTokenStore = {}

// Initialize AI Services
const aiAnalyzer = new AIAnalyzer()
const aiTriggerService = new AITriggerService()

// Helper function to generate auth token
const generateAuthToken = (userId) => {
  const data = {
    user: {
      id: userId
    }
  }
  return jwt.sign(data, JWT_SECRET)
}

// Helper function to send welcome email
const sendWelcomeEmail = async (email, name) => {
  const subject = 'Welcome to Sampatti'
  const text = `Hello ${name},\n\nThank you for signing up for Sampatti. We are excited to have you on board!\n\nBest regards,\nThe Sampatti Team`
  const html = `<p>Hello ${name},</p><p>Thank you for signing up for Sampatti. We are excited to have you on board!</p><p>Best regards,<br>The Sampatti Team</p>`

  try {
    await sendMail(email, subject, text, html)
    return { success: true }
  } catch (error) {
    console.error('Welcome email failed:', error)
    return { success: false, error: error.message }
  }
}

// Helper to initialize user AI profile
const initializeUserAIProfile = async (userId) => {
  try {
    const user = await User.findById(userId)
    if (user) {
      user.lastAIAnalysis = new Date()
      user.financialHealthScore = 50
      await user.save()

      setTimeout(async () => {
        try {
          await aiTriggerService.triggerAnalysis(userId)
          const analysis = await aiAnalyzer.analyzeUserFinances(userId)
          if (analysis.success) {
            const insights = [
              analysis.summary.financialHealth.rating,
              ...analysis.recommendations.immediate.slice(0, 2)
            ]

            await User.findByIdAndUpdate(userId, {
              $push: { aiInsights: { $each: insights } },
              financialHealthScore: analysis.summary.financialHealth.score,
              lastAIAnalysis: new Date()
            })
          }
        } catch (error) {
          console.error('Initial AI analysis failed:', error)
        }
      }, 1000)
    }
  } catch (error) {
    console.error('AI profile initialization failed:', error)
  }
}

// ========== GOOGLE OAUTH ROUTES ==========

// Initialize Google OAuth2Client - FIXED
// Create client without client secret for ID token verification
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID)

// ROUTE: Redirect to Google OAuth
router.get('/google', (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
  const options = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback',
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent'
  }

  const qs = new URLSearchParams(options)
  res.redirect(`${rootUrl}?${qs.toString()}`)
})

// ROUTE: Handle Google OAuth Callback - FIXED
// ROUTE: Handle Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query

    if (!code) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
      return res.redirect(`${frontendUrl}/login?error=Authorization code not found`)
    }

    // Exchange code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback',
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Token exchange failed')
    }

    // Verify ID token
    const ticket = await client.verifyIdToken({
      idToken: tokenData.id_token,
      audience: GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const { sub: googleId, email, name, picture } = payload

    // Check if user exists
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: { $regex: `^${email}$`, $options: 'i' } }
      ]
    })

    let isNewUser = false
    if (!user) {
      // Create username from email
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
      let username = baseUsername
      let counter = 1

      while (await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })) {
        username = `${baseUsername}${counter}`
        counter++
      }

      user = await User.create({
        googleId,
        username,
        name,
        email,
        profilePic: picture || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        phone: null,
        primaryMOI: null,
        monthlyIncome: 0,
        balance: 0,
        financialHealthScore: 50,
        lastAIAnalysis: new Date(),
        isVerified: true,
        onboardingComplete: false,
        onboardingStep: 1
      })

      await sendWelcomeEmail(email, name)
      await initializeUserAIProfile(user.id)
      isNewUser = true
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    const authToken = generateAuthToken(user.id)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    // **CRITICAL FIX:** Send user data directly instead of just token
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      financialHealthScore: user.financialHealthScore,
      balance: user.balance,
      monthlyIncome: user.monthlyIncome,
      primaryMOI: user.primaryMOI,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep
    }

    // Encode the data for URL
    const encodedUserData = encodeURIComponent(JSON.stringify(userData))

    if (isNewUser || !user.onboardingComplete) {
      // Redirect to onboarding for new users
      res.redirect(`${frontendUrl}/onboarding?token=${authToken}&user=${encodedUserData}&isNewUser=true`)
    } else {
      // Redirect to dashboard for existing users
      res.redirect(`${frontendUrl}/dashboard?token=${authToken}&user=${encodedUserData}`)
    }
  } catch (error) {
    console.error('Google callback error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
})

// ROUTE: Google Signup/Login (Alternative method) - SIMPLIFIED
router.post('/google-auth', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ success: false, error: 'Google token is required' })
    }

    // For direct token verification (from frontend), use a simpler approach
    // First, try to verify it as an ID token
    try {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID
      })

      const payload = ticket.getPayload()
      const { sub: googleId, email, name, picture } = payload

      return await handleGoogleUser(googleId, email, name, picture, res)
    } catch (idTokenError) {
      console.log('Not an ID token, trying as access token...')

      // If it's not an ID token, try to get user info using it as an access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!userInfoResponse.ok) {
        throw new Error('Failed to get user info from Google')
      }

      const userInfo = await userInfoResponse.json()
      const { sub: googleId, email, name, picture } = userInfo

      return await handleGoogleUser(googleId, email, name, picture, res)
    }
  } catch (error) {
    console.error('Google auth error:', error)
    res.status(401).json({
      success: false,
      error: 'Google authentication failed. Please try again.'
    })
  }
})

// Helper function to handle Google user creation/login
async function handleGoogleUser (googleId, email, name, picture, res) {
  // Check if user exists
  let user = await User.findOne({
    $or: [
      { googleId },
      { email: { $regex: `^${email}$`, $options: 'i' } }
    ]
  })

  let isNewUser = false
  if (!user) {
    const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_')
    let username = baseUsername
    let counter = 1

    while (await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })) {
      username = `${baseUsername}${counter}`
      counter++
    }

    user = await User.create({
      googleId,
      username,
      name,
      email,
      profilePic: picture || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
      phone: null,
      primaryMOI: null,
      monthlyIncome: 0,
      balance: 0,
      financialHealthScore: 50,
      lastAIAnalysis: new Date(),
      isVerified: true,
      onboardingComplete: false,
      onboardingStep: 1
    })

    await sendWelcomeEmail(email, name)
    await initializeUserAIProfile(user.id)
    isNewUser = true
  }

  user.lastLogin = new Date()
  await user.save()

  const authToken = generateAuthToken(user.id)

  res.json({
    success: true,
    authToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      financialHealthScore: user.financialHealthScore,
      balance: user.balance,
      monthlyIncome: user.monthlyIncome,
      primaryMOI: user.primaryMOI,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep
    },
    requiresOnboarding: !user.onboardingComplete,
    isNewUser
  })
}

// ========== REGULAR SIGNUP & LOGIN ==========

// ROUTE 1: Generate OTP for signup
router.post('/generateotp', [
  body('email', 'Enter a valid Email').isEmail()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { email } = req.body

  // REMOVED email existence check here - it will be checked in createuser

  const otp = otpGenerator.generate(6, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false
  })

  // Store OTP with expiration (10 minutes)
  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  }

  const subject = 'Your OTP for Sampatti Signup'
  const text = `Your OTP for signing up on Sampatti is ${otp}. It is valid for 10 minutes.`
  const html = `<p>Your OTP for signing up on Sampatti is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`

  try {
    await sendMail(email, subject, text, html)
    return res.json({
      success: true,
      message: 'OTP sent to email'
    })
  } catch (error) {
    console.error('Error sending mail:', error)
    delete otpStore[email]
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.'
    })
  }
})

// ROUTE 2: Create user (Step 1 - Basic Info)
router.post('/createuser',
  [
    body('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[A-Za-z0-9_.-]+$/)
      .withMessage('Only letter, Numbers, _-. are allowed'),
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid Email').isEmail(),
    body('password', 'Enter a valid password').isLength({ min: 5 })
    // REMOVED: phone, modeofIncome, monthlyincome validations (will be in onboarding)
  ], async (req, res) => {
    let success = false
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() })
    }

    const { username, name, email, password, otp } = req.body

    // Verify OTP
    const storedOTP = otpStore[email]
    if (!storedOTP || storedOTP.otp !== otp) {
      return res.status(400).json({ success: false, error: 'Invalid OTP' })
    }

    try {
      // Check if email already exists
      let user = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } })
      if (user) {
        return res.status(400).json({ success: false, error: 'A user with this email already exists' })
      }

      // Check if username already exists
      user = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } })
      if (user) {
        return res.status(400).json({ success: false, error: 'A user with this username already exists' })
      }

      const salt = await bcrypt.genSalt(10)
      const secPass = await bcrypt.hash(password, salt)

      user = await User.create({
        username,
        name,
        email,
        password: secPass,
        phone: null, // Will be filled in onboarding
        primaryMOI: null, // Will be filled in onboarding
        monthlyIncome: 0, // Will be filled in onboarding
        balance: 0,
        financialHealthScore: 50,
        lastAIAnalysis: new Date(),
        onboardingComplete: false,
        onboardingStep: 1
      })

      const authToken = generateAuthToken(user.id)
      success = true

      // Send welcome email
      await sendWelcomeEmail(email, name)

      // Initialize AI profile
      await initializeUserAIProfile(user.id)

      // Clear OTP
      delete otpStore[email]

      res.json({
        success,
        authToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          onboardingComplete: user.onboardingComplete,
          onboardingStep: user.onboardingStep
        },
        requiresOnboarding: true
      })
    } catch (error) {
      console.error(error.message)
      res.status(500).json({ success: false, error: 'Internal Server Error' })
    }
  }
)

// ROUTE 3: Authenticate user login
router.post('/login', [
  body('identifier', 'Enter a valid email or username').notEmpty(),
  body('password', 'Password cannot be blank').exists()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { identifier, password } = req.body

  try {
    const user = await User.findOne({
      $or: [
        { email: { $regex: `^${identifier}$`, $options: 'i' } },
        { username: { $regex: `^${identifier}$`, $options: 'i' } }
      ]
    })

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' })
    }

    // Check if user uses Google auth
    if (user.googleId && !user.password) {
      return res.status(400).json({
        success: false,
        error: 'Please use Google Sign In for this account'
      })
    }

    const passwordCompare = await bcrypt.compare(password, user.password)
    if (!passwordCompare) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials' })
    }

    user.lastLogin = new Date()
    await user.save()

    const authToken = generateAuthToken(user.id)

    res.json({
      success: true,
      authToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        username: user.username,
        financialHealthScore: user.financialHealthScore,
        balance: user.balance,
        monthlyIncome: user.monthlyIncome,
        primaryMOI: user.primaryMOI,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep
      }
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
})

// ========== ONBOARDING ROUTES ==========

// ROUTE 4: Complete user onboarding (Step 2 - Financial Info)
router.post('/complete-onboarding', fetchuser, [
  body('phone').optional().isLength({ min: 10 }),
  body('primaryMOI').optional().isIn(['Salary', 'Business', 'Freelance', 'Investment', 'Pension', 'Other']),
  body('monthlyIncome').optional().isNumeric().isFloat({ min: 0 }),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('savingsTarget').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const userId = req.user.id
    const updates = req.body

    // Set onboarding as complete
    updates.onboardingComplete = true
    updates.onboardingStep = 3

    // If monthlyIncome is provided, ensure it's a number
    if (updates.monthlyIncome) {
      updates.monthlyIncome = parseFloat(updates.monthlyIncome)
    }

    // If phone is provided, ensure it's a number
    if (updates.phone) {
      updates.phone = parseInt(updates.phone)
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        primaryMOI: user.primaryMOI,
        monthlyIncome: user.monthlyIncome,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        currency: user.currency,
        savingsTarget: user.savingsTarget
      }
    })
  } catch (error) {
    console.error('Onboarding error:', error)
    res.status(500).json({ success: false, error: 'Failed to complete onboarding' })
  }
})

// ROUTE 5: Update onboarding step
router.put('/update-onboarding-step', fetchuser, [
  body('step').isInt({ min: 1, max: 3 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const userId = req.user.id
    const { step } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { onboardingStep: step } },
      { new: true }
    ).select('onboardingStep onboardingComplete')

    res.json({
      success: true,
      onboardingStep: user.onboardingStep,
      onboardingComplete: user.onboardingComplete
    })
  } catch (error) {
    console.error('Update step error:', error)
    res.status(500).json({ success: false, error: 'Failed to update step' })
  }
})

// ROUTE 6: Get onboarding status
router.get('/onboarding-status', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select('onboardingComplete onboardingStep phone primaryMOI monthlyIncome')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    // Determine which fields are missing
    const missingFields = []
    if (!user.phone) missingFields.push('phone')
    if (!user.primaryMOI) missingFields.push('primaryMOI')
    if (!user.monthlyIncome || user.monthlyIncome === 0) missingFields.push('monthlyIncome')

    res.json({
      success: true,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      missingFields,
      progress: {
        step1: true, // Basic info always complete after signup
        step2: !(!user.phone || !user.primaryMOI || !user.monthlyIncome),
        step3: user.onboardingComplete
      },
      user: {
        phone: user.phone,
        primaryMOI: user.primaryMOI,
        monthlyIncome: user.monthlyIncome
      }
    })
  } catch (error) {
    console.error('Onboarding status error:', error)
    res.status(500).json({ success: false, error: 'Failed to get onboarding status' })
  }
})

// ========== PASSWORD RESET ROUTES ==========

// ROUTE 7: Request Password Reset
router.post('/request-reset-password', [
  body('email', 'Enter a valid Email').isEmail()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { email } = req.body
  const user = await User.findOne({ email })
  if (!user) {
    return res.status(400).json({ success: false, error: 'No user found with this email' })
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + 15 * 60 * 1000

  if (!resetTokenStore[email]) {
    resetTokenStore[email] = []
  }
  resetTokenStore[email].push({ token: resetToken, expiresAt })

  const resetLink = `${process.env.LIVE_LINK || 'http://localhost:3006'}/reset-password?token=${resetToken}&email=${email}`
  const subject = 'Password Reset Request'
  const text = `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`
  const html = `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, please ignore this email.</p>`

  try {
    await sendMail(email, subject, text, html)
    res.json({ success: true, message: 'Password reset link sent to email' })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
})

// ROUTE 8: Reset Password
router.post('/reset-password', [
  body('email', 'Enter a valid Email').isEmail(),
  body('token', 'Token is required').notEmpty(),
  body('password', 'Enter a valid password').isLength({ min: 5 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { email, token, password } = req.body

  if (!resetTokenStore[email]) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' })
  }

  const validTokenIndex = resetTokenStore[email].findIndex(
    (entry) => entry.token === token && entry.expiresAt > Date.now()
  )

  if (validTokenIndex === -1) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ success: false, error: 'No user found with this email' })
    }

    const salt = await bcrypt.genSalt(10)
    const secPass = await bcrypt.hash(password, salt)

    user.password = secPass
    await user.save()

    delete resetTokenStore[email]

    res.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({ success: false, error: 'Internal Server Error' })
  }
})

// ROUTE 9: Verify OTP (Separate endpoint)
router.post('/verify-otp', [
  body('email', 'Enter a valid Email').isEmail(),
  body('otp', 'OTP is required').isLength({ min: 6, max: 6 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  const { email, otp } = req.body

  const storedOTP = otpStore[email]

  if (!storedOTP) {
    return res.status(400).json({ success: false, error: 'OTP expired or not found' })
  }

  if (storedOTP.expiresAt < Date.now()) {
    delete otpStore[email]
    return res.status(400).json({ success: false, error: 'OTP expired' })
  }

  if (storedOTP.otp !== otp) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' })
  }

  res.json({ success: true, message: 'OTP verified successfully' })
})

// ========== PROTECTED ROUTES (Require Authentication) ==========

// ROUTE 10: Get AI Financial Analysis
router.get('/ai-analysis', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    // Check if user has completed onboarding
    if (!user.onboardingComplete) {
      return res.status(400).json({
        success: false,
        error: 'Please complete your onboarding first',
        requiresOnboarding: true
      })
    }

    const analysis = await aiAnalyzer.analyzeUserFinances(userId)

    if (!analysis.success) {
      return res.status(400).json({ success: false, error: analysis.message })
    }

    await User.findByIdAndUpdate(userId, {
      lastAIAnalysis: new Date(),
      financialHealthScore: analysis.summary.financialHealth.score
    }, { new: true })

    res.json({
      success: true,
      analysis,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    res.status(500).json({ success: false, error: 'Failed to generate analysis' })
  }
})

// ROUTE 11: Get Spending Insights
router.get('/spending-insights', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id
    const insights = await aiAnalyzer.getSpendingInsights(userId)

    res.json({
      success: true,
      insights,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Spending insights error:', error)
    res.status(500).json({ success: false, error: 'Failed to get insights' })
  }
})

// ROUTE 12: Get Financial Health Score
router.get('/financial-health', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id

    const health = await aiAnalyzer.getFinancialHealth(userId)

    if (!health.success) {
      return res.status(400).json({ success: false, error: health.error })
    }

    await User.findByIdAndUpdate(userId, {
      financialHealthScore: health.score,
      lastAIAnalysis: new Date()
    })

    res.json({
      success: true,
      score: health.score,
      rating: health.rating,
      breakdown: health.breakdown,
      lastUpdated: new Date()
    })
  } catch (error) {
    console.error('Financial health error:', error)
    res.status(500).json({ success: false, error: 'Failed to calculate financial health' })
  }
})

// ROUTE 13: Get User Profile with AI Data
router.get('/profile', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        phone: user.phone,
        balance: user.balance,
        monthlyIncome: user.monthlyIncome,
        primaryMOI: user.primaryMOI,
        financialHealthScore: user.financialHealthScore,
        aiInsights: user.aiInsights || [],
        lastAIAnalysis: user.lastAIAnalysis,
        currency: user.currency,
        savingsTarget: user.savingsTarget,
        monthlyBudget: user.monthlyBudget,
        totalSavings: user.totalSavings,
        totalIncome: user.totalIncome,
        totalExpense: user.totalExpense,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to get profile' })
  }
})

// ROUTE 14: Update user profile
router.put('/update-profile', fetchuser, [
  body('name').optional().isLength({ min: 3 }),
  body('phone').optional().isLength({ min: 10 }),
  body('primaryMOI').optional().isIn(['Salary', 'Business', 'Freelance', 'Investment', 'Pension', 'Other']),
  body('monthlyIncome').optional().isNumeric().isFloat({ min: 0 }),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('savingsTarget').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() })
  }

  try {
    const userId = req.user.id
    const updates = req.body

    // If updating financial fields, mark onboarding as complete
    if (updates.phone || updates.primaryMOI || updates.monthlyIncome) {
      updates.onboardingComplete = true
      updates.onboardingStep = 3
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        primaryMOI: user.primaryMOI,
        monthlyIncome: user.monthlyIncome,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        currency: user.currency,
        savingsTarget: user.savingsTarget
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ success: false, error: 'Failed to update profile' })
  }
})

// ROUTE: Verify JWT token and return user data
router.get('/verify-token', fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        profilePic: user.profilePic,
        phone: user.phone,
        primaryMOI: user.primaryMOI,
        monthlyIncome: user.monthlyIncome,
        balance: user.balance,
        financialHealthScore: user.financialHealthScore,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        currency: user.currency
      }
    })
  } catch (error) {
    console.error('Token verification error:', error)
    res.status(401).json({ success: false, error: 'Invalid token' })
  }
})

module.exports = router
