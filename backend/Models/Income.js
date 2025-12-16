// models/Income.js
const mongoose = require('mongoose')

const IncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Bonus', 'Gift', 'Other']
  },
  desc: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  creditedOn: {
    type: Date,
    default: Date.now
  },
  recordedDate: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    default: '',
    maxlength: [100, 'Source cannot exceed 100 characters']
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
    enum: ['Pending', 'Received', 'Cancelled'],
    default: 'Received'
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
})

// Create indexes for better performance
IncomeSchema.index({ userId: 1, creditedOn: -1 })
IncomeSchema.index({ userId: 1, category: 1 })
IncomeSchema.index({ userId: 1, isRecurring: 1 })
IncomeSchema.index({ userId: 1, status: 1 })

const Income = mongoose.model('Income', IncomeSchema)
module.exports = Income
