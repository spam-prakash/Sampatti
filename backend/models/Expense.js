const mongoose = require('mongoose')

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Personal', 'Other']
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other'],
    default: 'Cash'
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  merchant: {
    type: String,
    default: '',
    trim: true
  },
  isEssential: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrenceType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Yearly', null],
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Completed'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    default: '',
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
})

// Indexes for better query performance
ExpenseSchema.index({ userId: 1, date: -1 })
ExpenseSchema.index({ userId: 1, category: 1 })
ExpenseSchema.index({ userId: 1, isRecurring: 1 })
ExpenseSchema.index({ userId: 1, paymentMethod: 1 })
ExpenseSchema.index({ userId: 1, isEssential: 1 })

// Virtual field for formatted date
ExpenseSchema.virtual('formattedDate').get(function () {
  return this.date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

// Virtual for month-year grouping
ExpenseSchema.virtual('monthYear').get(function () {
  return {
    month: this.date.getMonth() + 1,
    year: this.date.getFullYear()
  }
})

// Static method for monthly summary (FIXED: Added new keyword)
ExpenseSchema.statics.getMonthlySummary = async function (userId, year, month) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId), // FIXED: Added new keyword
        date: { $gte: startDate, $lte: endDate },
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        essentialCount: {
          $sum: { $cond: [{ $eq: ['$isEssential', true] }, 1, 0] }
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ])
}

// Static method for spending trend (FIXED: Added new keyword)
ExpenseSchema.statics.getSpendingTrend = async function (userId, months = 6) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId), // FIXED: Added new keyword
        date: { $gte: startDate, $lte: endDate },
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          category: '$category'
        },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ])
}

// Method to check if expense is from this month
ExpenseSchema.methods.isFromCurrentMonth = function () {
  const now = new Date()
  const expenseDate = this.date
  return expenseDate.getMonth() === now.getMonth() &&
           expenseDate.getFullYear() === now.getFullYear()
}

// Method to duplicate expense (for recurring)
ExpenseSchema.methods.duplicate = function () {
  const newExpense = this.toObject()
  delete newExpense._id
  delete newExpense.createdAt
  delete newExpense.updatedAt
  delete newExpense.date
  newExpense.date = new Date()

  return this.model('Expense').create(newExpense)
}

// Method to mark as essential/non-essential
ExpenseSchema.methods.toggleEssential = function () {
  this.isEssential = !this.isEssential
  return this.save()
}

// NEW: Method to check if expense is recurring
ExpenseSchema.methods.isRecurringExpense = function () {
  return this.isRecurring && this.recurrenceType
}

// NEW: Method to get next recurrence date
ExpenseSchema.methods.getNextRecurrenceDate = function () {
  if (!this.isRecurring || !this.recurrenceType) return null

  const currentDate = new Date(this.date)
  const nextDate = new Date(currentDate)

  switch (this.recurrenceType) {
    case 'Daily':
      nextDate.setDate(currentDate.getDate() + 1)
      break
    case 'Weekly':
      nextDate.setDate(currentDate.getDate() + 7)
      break
    case 'Monthly':
      nextDate.setMonth(currentDate.getMonth() + 1)
      break
    case 'Yearly':
      nextDate.setFullYear(currentDate.getFullYear() + 1)
      break
  }

  return nextDate
}

// NEW: Method to format amount with currency
ExpenseSchema.methods.getFormattedAmount = function (currency = '₹') {
  return `${currency}${this.amount.toFixed(2)}`
}

// NEW: Static method to get total expenses for user
ExpenseSchema.statics.getTotalExpenses = async function (userId) {
  const result = await this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])

  return result.length > 0
    ? {
        totalAmount: result[0].totalAmount || 0,
        count: result[0].count || 0
      }
    : { totalAmount: 0, count: 0 }
}

// NEW: Static method to get expenses by category
ExpenseSchema.statics.getExpensesByCategory = async function (userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: 'Completed'
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' },
        lastExpenseDate: { $max: '$date' }
      }
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit }
  ])
}

module.exports = mongoose.model('Expense', ExpenseSchema)
