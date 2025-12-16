const mongoose = require('mongoose')

const goalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  desc: {
    type: String,
    default: ''
  },
  priorityLevel: {
    type: Number,
    default: 3,
    min: 1,
    max: 5
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 1
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    default: 'general',
    enum: ['Emergency Fund', 'Car', 'House', 'Travel', 'Education', 'Retirement', 'Wedding', 'Business', 'Gadgets', 'Health', 'Other', 'general']
  },
  deadline: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  difficulty: {
    type: String,
    default: 'Medium',
    enum: ['Easy', 'Medium', 'Hard', 'Very Hard']
  },
  riskLevel: {
    type: String,
    default: 'Medium',
    enum: ['Low', 'Medium', 'High']
  },
  status: {
    type: String,
    default: 'Not Started',
    enum: ['Not Started', 'In Progress', 'Almost There', 'Completed', 'Behind Schedule']
  },
  tags: [{
    type: String,
    trim: true
  }],
  autoDeduct: {
    type: Boolean,
    default: false
  },
  deductPercentage: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    default: ''
  },
  milestones: [{
    amount: Number,
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Add index for better query performance
goalSchema.index({ userId: 1, deadline: 1 })
goalSchema.index({ userId: 1, isCompleted: 1 })
goalSchema.index({ userId: 1, category: 1 })

// Middleware to calculate derived fields before saving - FIXED
goalSchema.pre('save', function (next) {
  // Only calculate if targetAmount or currentAmount changed
  if (this.isModified('targetAmount') || this.isModified('currentAmount') || this.isNew) {
    // Calculate remaining amount
    this.remainingAmount = Math.max(0, this.targetAmount - this.currentAmount)

    // Calculate progress
    if (this.targetAmount > 0) {
      this.progress = (this.currentAmount / this.targetAmount) * 100
      this.progress = Math.min(100, Math.max(0, this.progress)) // Clamp between 0-100
    } else {
      this.progress = 0
    }

    // Update isCompleted based on progress
    this.isCompleted = this.progress >= 100

    // Update status based on progress
    if (this.isCompleted) {
      this.status = 'Completed'
    } else if (this.progress === 0) {
      this.status = 'Not Started'
    } else if (this.progress < 50) {
      this.status = 'In Progress'
    } else if (this.progress < 100) {
      this.status = 'Almost There'
    }
  }

  // Always call next() to continue the save process
  if (typeof next === 'function') {
    next()
  }
})

// Instance method to add amount - SIMPLIFIED VERSION
goalSchema.methods.addAmount = async function (amount) {
  try {
    // Update current amount
    this.currentAmount += parseFloat(amount)

    // Add milestone
    this.milestones.push({
      amount: parseFloat(amount),
      description: `Added savings of ₹${amount}`,
      date: new Date()
    })

    // Save the document - middleware will handle calculations
    return await this.save()
  } catch (error) {
    console.error('Error in addAmount:', error)
    throw error
  }
}

// Instance method to add milestone
goalSchema.methods.addMilestone = async function (amount, description) {
  try {
    const milestone = {
      amount: parseFloat(amount),
      description: description || `Milestone of ₹${amount}`,
      date: new Date()
    }

    this.milestones.push(milestone)
    this.currentAmount += parseFloat(amount)

    return await this.save()
  } catch (error) {
    console.error('Error in addMilestone:', error)
    throw error
  }
}

// Static method to get goals by status
goalSchema.statics.getGoalsByStatus = async function (userId) {
  const goals = await this.find({ userId })

  const byStatus = {
    'Not Started': [],
    'In Progress': [],
    'Almost There': [],
    Completed: [],
    'Behind Schedule': []
  }

  goals.forEach(goal => {
    const status = goal.status || 'Not Started'
    if (byStatus[status]) {
      byStatus[status].push(goal)
    }
  })

  return byStatus
}

// Static method to calculate monthly savings required
goalSchema.statics.getMonthlySavingsRequired = async function (userId) {
  const goals = await this.find({
    userId,
    isCompleted: false,
    deadline: { $gt: new Date() }
  })

  if (goals.length === 0) {
    return []
  }

  let totalMonthlyNeeded = 0
  let avgMonthlyNeeded = 0

  goals.forEach(goal => {
    const remaining = goal.targetAmount - goal.currentAmount
    const now = new Date()
    const monthsLeft = Math.max(1, Math.ceil((goal.deadline - now) / (1000 * 60 * 60 * 24 * 30)))

    if (remaining > 0 && monthsLeft > 0) {
      const monthlyNeed = remaining / monthsLeft
      totalMonthlyNeeded += monthlyNeed
    }
  })

  avgMonthlyNeeded = totalMonthlyNeeded / goals.length

  return [{
    totalMonthlyNeeded: Math.round(totalMonthlyNeeded * 100) / 100,
    avgMonthlyNeeded: Math.round(avgMonthlyNeeded * 100) / 100
  }]
}

const Goal = mongoose.model('Goal', goalSchema)

module.exports = Goal
