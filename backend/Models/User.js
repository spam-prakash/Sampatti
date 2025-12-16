const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  // Authentication & Profile
  googleId: {
    type: String,
    required: false
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: Number,
    required: false, // Changed from true to false
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  profilePic: {
    type: String,
    required: false,
    default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  },
  password: {
    type: String,
    required: false
  },

  // Financial Information - MADE OPTIONAL
  balance: {
    type: Number,
    default: 0
  },
  primaryMOI: {
    type: String,
    required: false, // Changed from true
    enum: ['Salary', 'Rent', 'Business', 'Freelance', 'Investment', 'Pension', 'Other', null],
    default: null
  },
  monthlyIncome: {
    type: Number,
    required: false, // Changed from true
    min: 0,
    default: 0
  },

  // Add onboarding status
  onboardingComplete: {
    type: Boolean,
    default: false
  },
  onboardingStep: {
    type: Number,
    default: 1, // 1=basic info, 2=financial info, 3=preferences
    min: 1,
    max: 3
  },
  // Financial Tracking (for AI analysis)
  totalIncome: {
    type: Number,
    default: 0,
    min: 0
  },
  totalExpense: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSavings: {
    type: Number,
    default: 0,
    min: 0
  },

  // Counters
  incomeCount: {
    type: Number,
    default: 0
  },
  expenseCount: {
    type: Number,
    default: 0
  },
  goalCount: {
    type: Number,
    default: 0
  },

  // User Preferences & Settings
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'es', 'fr', 'de']
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },

  // Notification Preferences
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    lowBalanceAlert: {
      type: Boolean,
      default: true
    },
    billReminders: {
      type: Boolean,
      default: true
    },
    goalReminders: {
      type: Boolean,
      default: true
    }
  },

  // Budget Settings
  monthlyBudget: {
    type: Number,
    default: 0,
    min: 0
  },
  savingsTarget: {
    type: Number,
    default: 20, // Percentage of income
    min: 0,
    max: 100
  },

  // AI & Analytics
  lastAIAnalysis: {
    type: Date
  },
  financialHealthScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  aiInsights: [{
    type: String,
    trim: true
  }],

  // Security & Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },

  // Timestamps
  lastLogin: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
})

// Indexes for better query performance
UserSchema.index({ email: 1 })
UserSchema.index({ username: 1 })
UserSchema.index({ 'notifications.emailNotifications': 1 })

// Virtual for formatted balance
UserSchema.virtual('formattedBalance').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR'
  }).format(this.balance)
})

// Virtual for formatted monthly income
UserSchema.virtual('formattedMonthlyIncome').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR'
  }).format(this.monthlyIncome)
})

// Virtual for savings rate
UserSchema.virtual('savingsRate').get(function () {
  if (this.monthlyIncome > 0) {
    return ((this.totalSavings / this.monthlyIncome) * 100).toFixed(2)
  }
  return 0
})

// Method to update financial metrics
UserSchema.methods.updateFinancialMetrics = function () {
  // Calculate total savings (balance)
  this.totalSavings = this.balance

  // Calculate financial health score (simple version)
  let score = 50

  // Income factor
  if (this.monthlyIncome > 50000) score += 20
  else if (this.monthlyIncome > 25000) score += 10

  // Savings rate factor
  const savingsRate = this.monthlyIncome > 0 ? (this.totalSavings / this.monthlyIncome) : 0
  if (savingsRate > 0.3) score += 20
  else if (savingsRate > 0.2) score += 10
  else if (savingsRate > 0.1) score += 5

  // Goals factor
  if (this.goalCount > 0) score += 10

  // Ensure score is between 0-100
  this.financialHealthScore = Math.max(0, Math.min(100, score))

  return this.save()
}

// Method to add income
UserSchema.methods.addIncome = function (amount) {
  this.balance += amount
  this.totalIncome += amount
  this.incomeCount += 1
  return this.save()
}

// Method to add expense
UserSchema.methods.addExpense = function (amount) {
  this.balance -= amount
  this.totalExpense += amount
  this.expenseCount += 1
  return this.save()
}

// Method to check if user is on track for savings
UserSchema.methods.isOnTrackForSavings = function () {
  const currentSavingsRate = this.monthlyIncome > 0
    ? (this.totalSavings / this.monthlyIncome) * 100
    : 0
  return currentSavingsRate >= this.savingsTarget
}

// Static method to find users by financial health
UserSchema.statics.findByFinancialHealth = function (minScore = 0, maxScore = 100) {
  return this.find({
    financialHealthScore: { $gte: minScore, $lte: maxScore }
  }).sort({ financialHealthScore: -1 })
}

// Static method to get user statistics
UserSchema.statics.getUserStats = async function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        avgBalance: { $avg: '$balance' },
        avgMonthlyIncome: { $avg: '$monthlyIncome' },
        avgFinancialHealth: { $avg: '$financialHealthScore' },
        totalSavings: { $sum: '$totalSavings' }
      }
    }
  ])
}

module.exports = mongoose.model('User', UserSchema)
