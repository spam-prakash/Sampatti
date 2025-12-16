const express = require('express')
const User = require('../models/User')
const Expense = require('../models/Expense')
const router = express.Router()
const { body, validationResult } = require('express-validator')
const fetchuser = require('../middleware/fetchuser')
const mongoose = require('mongoose')

// LATE LOADING - Load AI service only when needed, not at top
let AITriggerService = null
let FinancialAIService = null

const loadAIServices = () => {
  if (!AITriggerService) {
    try {
      AITriggerService = require('../services/AITriggerService')
    } catch (error) {
      console.log('AI Trigger Service not available')
    }
  }

  if (!FinancialAIService && process.env.USE_INLINE_AI === 'true') {
    try {
      FinancialAIService = require('../services/FinancialAIService')
    } catch (error) {
      console.log('Financial AI Service not available')
    }
  }
}

const triggerAIAnalysis = async (userId) => {
  loadAIServices() // Load only when called

  if (AITriggerService) {
    const triggerService = new AITriggerService()
    await triggerService.triggerAnalysis(userId)
  }
}

const getExpenseAIInsights = async (expenses) => {
  loadAIServices() // Load only when called

  if (FinancialAIService && expenses.length > 0) {
    try {
      const aiService = new FinancialAIService()
      return aiService.analyzeSpendingPatterns(expenses)
    } catch (aiError) {
      console.error('AI Insights failed:', aiError.message)
    }
  }
  return { message: 'AI analysis not available' }
}

const isAIAvailable = () => {
  loadAIServices()
  return FinancialAIService !== null
}

// ===== SPECIFIC ROUTES FIRST =====

// ROUTE 1: ADD EXPENSE using "/api/expense/add" LOGIN REQUIRED
router.post('/add', fetchuser, [
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('category', 'Category is required').isIn(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Personal', 'Other']),
  body('date', 'Invalid date format').optional().isISO8601().toDate(),
  body('description', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('paymentMethod', 'Invalid payment method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']),
  body('notes', 'Notes cannot be more than 1000 characters').optional().isLength({ max: 1000 })
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const {
      amount,
      category,
      description,
      date,
      paymentMethod,
      location,
      merchant,
      isEssential,
      isRecurring,
      recurrenceType,
      status,
      tags,
      notes
    } = req.body

    const expense = new Expense({
      amount: parseFloat(amount),
      category,
      description: description || '',
      date: date || new Date(),
      userId: req.user.id,
      paymentMethod: paymentMethod || 'Cash',
      location: location || '',
      merchant: merchant || '',
      isEssential: isEssential !== undefined ? isEssential : true,
      isRecurring: isRecurring || false,
      recurrenceType: isRecurring ? recurrenceType : null,
      status: status || 'Completed',
      tags: tags || [],
      notes: notes || ''
    })

    // Save Expense
    const savedExpense = await expense.save()

    // Update User balance
    const user = await User.findById(req.user.id)
    user.balance -= parseFloat(amount)
    user.totalExpense = (user.totalExpense || 0) + parseFloat(amount)
    user.expenseCount = (user.expenseCount || 0) + 1
    await user.save()

    // Trigger AI analysis in background
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Expense added successfully',
      data: savedExpense,
      newBalance: user.balance
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 2: GET ALL EXPENSES using "/api/expense/all" LOGIN REQUIRED
router.get('/all', fetchuser, async (req, res) => {
  try {
    const {
      month,
      year,
      category,
      paymentMethod,
      isEssential,
      isRecurring,
      status,
      limit,
      page
    } = req.query

    const userId = req.user.id
    const query = { userId }

    // Filter by month and year
    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)
      query.date = { $gte: startDate, $lte: endDate }
    }

    // Filter by category
    if (category) {
      query.category = category
    }

    // Filter by payment method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod
    }

    // Filter by essential
    if (isEssential !== undefined) {
      query.isEssential = isEssential === 'true'
    }

    // Filter by recurring
    if (isRecurring !== undefined) {
      query.isRecurring = isRecurring === 'true'
    }

    // Filter by status
    if (status) {
      query.status = status
    }

    // Pagination
    const pageNumber = parseInt(page) || 1
    const pageSize = parseInt(limit) || 10
    const skip = (pageNumber - 1) * pageSize

    // Get expenses with pagination
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize)

    // Get total count for pagination info
    const totalCount = await Expense.countDocuments(query)
    const totalAmount = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    // Get AI insights for this expense data
    const aiInsights = await getExpenseAIInsights(expenses)

    const stats = {
      totalCount,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      pageSize
    }

    res.json({
      success: true,
      message: 'Expenses fetched successfully',
      data: expenses,
      stats,
      aiInsights
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 3: GET EXPENSE STATISTICS using "/api/expense/stats" LOGIN REQUIRED
router.get('/stats', fetchuser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.id

    // Build date filter
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } else {
      // Default to current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      dateFilter.date = { $gte: startOfMonth, $lte: endOfMonth }
    }

    // Add user filter
    dateFilter.userId = userId
    dateFilter.status = 'Completed'

    // Get statistics
    const stats = await Expense.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          averageAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' },
          count: { $sum: 1 },
          byCategory: { $push: { category: '$category', amount: '$amount' } },
          byPaymentMethod: { $push: { paymentMethod: '$paymentMethod', amount: '$amount' } },
          essentialCount: { $sum: { $cond: [{ $eq: ['$isEssential', true] }, 1, 0] } },
          nonEssentialCount: { $sum: { $cond: [{ $eq: ['$isEssential', false] }, 1, 0] } },
          recurringCount: { $sum: { $cond: [{ $eq: ['$isRecurring', true] }, 1, 0] } }
        }
      }
    ])

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), // FIXED: Use new keyword
          date: { $gte: sixMonthsAgo },
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
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])

    // Process category breakdown
    const categoryBreakdown = {}
    const paymentMethodBreakdown = {}

    if (stats.length > 0) {
      // Category breakdown
      if (stats[0].byCategory) {
        stats[0].byCategory.forEach(item => {
          if (!categoryBreakdown[item.category]) {
            categoryBreakdown[item.category] = {
              total: 0,
              count: 0,
              average: 0
            }
          }
          categoryBreakdown[item.category].total += item.amount
          categoryBreakdown[item.category].count += 1
        })

        Object.keys(categoryBreakdown).forEach(category => {
          categoryBreakdown[category].average =
                        categoryBreakdown[category].total / categoryBreakdown[category].count
        })
      }

      // Payment method breakdown
      if (stats[0].byPaymentMethod) {
        stats[0].byPaymentMethod.forEach(item => {
          const method = item.paymentMethod || 'Unknown'
          if (!paymentMethodBreakdown[method]) {
            paymentMethodBreakdown[method] = {
              total: 0,
              count: 0,
              average: 0
            }
          }
          paymentMethodBreakdown[method].total += item.amount
          paymentMethodBreakdown[method].count += 1
        })

        Object.keys(paymentMethodBreakdown).forEach(method => {
          paymentMethodBreakdown[method].average =
                        paymentMethodBreakdown[method].total / paymentMethodBreakdown[method].count
        })
      }
    }

    // Format monthly trend
    const formattedTrend = monthlyTrend.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      category: item._id.category || 'Unknown',
      amount: item.totalAmount,
      count: item.count
    }))

    const result = {
      summary: stats.length > 0
        ? {
            totalAmount: stats[0].totalAmount || 0,
            averageAmount: stats[0].averageAmount || 0,
            maxAmount: stats[0].maxAmount || 0,
            minAmount: stats[0].minAmount || 0,
            count: stats[0].count || 0,
            essentialCount: stats[0].essentialCount || 0,
            nonEssentialCount: stats[0].nonEssentialCount || 0,
            recurringCount: stats[0].recurringCount || 0
          }
        : {
            totalAmount: 0,
            averageAmount: 0,
            maxAmount: 0,
            minAmount: 0,
            count: 0,
            essentialCount: 0,
            nonEssentialCount: 0,
            recurringCount: 0
          },
      categoryBreakdown,
      paymentMethodBreakdown,
      monthlyTrend: formattedTrend,
      period: {
        startDate: dateFilter.date.$gte,
        endDate: dateFilter.date.$lte
      }
    }

    // Add AI insights
    const aiInsights = await getExpenseAIInsights(await Expense.find(dateFilter))
    result.aiInsights = aiInsights

    res.json({
      success: true,
      message: 'Expense statistics fetched successfully',
      data: result
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 4: GET EXPENSE CATEGORIES using "/api/expense/categories" LOGIN REQUIRED
router.get('/categories', fetchuser, async (req, res) => {
  try {
    const categories = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id), // FIXED: Use new keyword
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          essentialPercentage: {
            $avg: { $cond: [{ $eq: ['$isEssential', true] }, 1, 0] }
          }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    // Format percentages
    const formattedCategories = categories.map(cat => ({
      ...cat,
      essentialPercentage: (cat.essentialPercentage * 100).toFixed(1) + '%'
    }))

    res.json({
      success: true,
      message: 'Expense categories fetched successfully',
      data: formattedCategories
    })
  } catch (error) {
    console.error('Categories error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 5: GET MONTHLY SPENDING ANALYSIS using "/api/expense/monthly-analysis" LOGIN REQUIRED
router.get('/monthly-analysis', fetchuser, async (req, res) => {
  try {
    const { month, year } = req.query
    const userId = req.user.id

    const targetMonth = month || new Date().getMonth() + 1
    const targetYear = year || new Date().getFullYear()

    const startDate = new Date(targetYear, targetMonth - 1, 1)
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999)

    const expenses = await Expense.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
      status: 'Completed'
    })

    const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0)
    const essentialExpenses = expenses.filter(exp => exp.isEssential)
    const nonEssentialExpenses = expenses.filter(exp => !exp.isEssential)

    const essentialAmount = essentialExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const nonEssentialAmount = nonEssentialExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    // Get previous month for comparison
    const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1
    const prevYear = targetMonth === 1 ? targetYear - 1 : targetYear

    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999)

    const prevExpenses = await Expense.find({
      userId,
      date: { $gte: prevStartDate, $lte: prevEndDate },
      status: 'Completed'
    })

    const prevTotalAmount = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const changePercentage = prevTotalAmount > 0
      ? ((totalAmount - prevTotalAmount) / prevTotalAmount * 100).toFixed(1)
      : 0

    const analysis = {
      month: targetMonth,
      year: targetYear,
      totalAmount,
      essentialAmount,
      nonEssentialAmount,
      essentialPercentage: totalAmount > 0 ? (essentialAmount / totalAmount * 100).toFixed(1) + '%' : '0%',
      transactionCount: expenses.length,
      averageTransaction: expenses.length > 0 ? (totalAmount / expenses.length).toFixed(2) : 0,
      monthOverMonthChange: changePercentage + '%',
      suggestion: getMonthlySuggestion(totalAmount, essentialAmount, nonEssentialAmount)
    }

    res.json({
      success: true,
      message: 'Monthly spending analysis fetched',
      data: analysis
    })
  } catch (error) {
    console.error('Monthly analysis error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// Helper function for monthly suggestions
function getMonthlySuggestion (totalAmount, essentialAmount, nonEssentialAmount) {
  const suggestions = []

  if (nonEssentialAmount > totalAmount * 0.3) {
    suggestions.push('Your non-essential spending is over 30%. Consider reducing discretionary expenses.')
  }

  if (totalAmount > 50000) {
    suggestions.push('Your monthly spending is high. Review your budget categories.')
  }

  if (essentialAmount < totalAmount * 0.5) {
    suggestions.push("Essential spending is less than 50%. Ensure you're covering basic needs first.")
  }

  return suggestions.length > 0 ? suggestions[0] : 'Your spending looks balanced this month.'
}

// ROUTE 6: GET AI EXPENSE INSIGHTS using "/api/expense/ai-insights" LOGIN REQUIRED
router.get('/ai-insights', fetchuser, async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI Service is not available'
      })
    }

    const expenses = await Expense.find({
      userId: req.user.id,
      status: 'Completed'
    })

    if (expenses.length === 0) {
      return res.json({
        success: true,
        message: 'No expense data available for AI analysis',
        data: {
          insights: ['Start tracking expenses to get AI insights'],
          suggestions: ['Add your first expense entry']
        }
      })
    }

    const aiService = new FinancialAIService()
    const analysis = aiService.analyzeSpendingPatterns(expenses)

    // Enhanced analysis with new fields
    const essentialExpenses = expenses.filter(exp => exp.isEssential)
    const nonEssentialExpenses = expenses.filter(exp => !exp.isEssential)

    const essentialTotal = essentialExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    const nonEssentialTotal = nonEssentialExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    const enhancedAnalysis = {
      ...analysis,
      essentialSpending: {
        total: essentialTotal,
        percentage: analysis.totalSpent > 0 ? (essentialTotal / analysis.totalSpent * 100).toFixed(1) + '%' : '0%',
        count: essentialExpenses.length
      },
      nonEssentialSpending: {
        total: nonEssentialTotal,
        percentage: analysis.totalSpent > 0 ? (nonEssentialTotal / analysis.totalSpent * 100).toFixed(1) + '%' : '0%',
        count: nonEssentialExpenses.length
      }
    }

    res.json({
      success: true,
      message: 'AI Expense Insights generated',
      data: enhancedAnalysis,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI insights error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 7: TOGGLE EXPENSE ESSENTIAL STATUS using "/api/expense/toggle-essential/:id" LOGIN REQUIRED
router.put('/toggle-essential/:id', fetchuser, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      })
    }

    expense.isEssential = !expense.isEssential
    const updatedExpense = await expense.save()

    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: `Expense marked as ${updatedExpense.isEssential ? 'Essential' : 'Non-Essential'}`,
      data: updatedExpense
    })
  } catch (error) {
    console.error('Toggle essential error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 8: ADD BULK EXPENSES using "/api/expense/bulk-add" LOGIN REQUIRED
router.post('/bulk-add', fetchuser, [
  body('expenses', 'Expenses array is required').isArray({ min: 1 }),
  body('expenses.*.amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('expenses.*.category', 'Category is required').isIn(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Personal', 'Other']),
  body('expenses.*.date', 'Invalid date format').optional().isISO8601().toDate()
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { expenses } = req.body
    const userId = req.user.id

    // Format expenses with user ID and default values
    const formattedExpenses = expenses.map(expense => ({
      amount: parseFloat(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: expense.date || new Date(),
      userId,
      paymentMethod: expense.paymentMethod || 'Cash',
      location: expense.location || '',
      merchant: expense.merchant || '',
      isEssential: expense.isEssential !== undefined ? expense.isEssential : true,
      isRecurring: expense.isRecurring || false,
      recurrenceType: expense.isRecurring ? expense.recurrenceType : null,
      status: expense.status || 'Completed',
      tags: expense.tags || [],
      notes: expense.notes || ''
    }))

    // Insert all expenses
    const savedExpenses = await Expense.insertMany(formattedExpenses)

    // Calculate total amount
    const totalAmount = formattedExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // Update user balance
    const user = await User.findById(userId)
    user.balance -= totalAmount
    user.totalExpense = (user.totalExpense || 0) + totalAmount
    user.expenseCount = (user.expenseCount || 0) + savedExpenses.length
    await user.save()

    // Trigger AI analysis in background
    triggerAIAnalysis(userId)

    res.json({
      success: true,
      message: `${savedExpenses.length} expenses added successfully`,
      data: {
        count: savedExpenses.length,
        totalAmount,
        newBalance: user.balance,
        expenses: savedExpenses
      },
      aiAnalysisTriggered: isAIAvailable()
    })
  } catch (error) {
    console.error('Bulk add error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ===== GENERIC ROUTES MUST COME LAST =====

// ROUTE 9: GET SINGLE EXPENSE using "/api/expense/:id" LOGIN REQUIRED
router.get('/:id', fetchuser, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      })
    }

    res.json({
      success: true,
      message: 'Expense fetched successfully',
      data: expense
    })
  } catch (error) {
    console.error('Get single expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 10: UPDATE EXPENSE using "/api/expense/update/:id" LOGIN REQUIRED
router.put('/update/:id', fetchuser, [
  body('amount', 'Amount must be a positive number').optional().isFloat({ min: 0.01 }),
  body('category', 'Invalid category').optional().isIn(['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Housing', 'Personal', 'Other']),
  body('date', 'Invalid date format').optional().isISO8601().toDate(),
  body('description', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('paymentMethod', 'Invalid payment method').optional().isIn(['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']),
  body('status', 'Invalid status').optional().isIn(['Pending', 'Completed', 'Cancelled'])
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { id } = req.params
    const {
      amount,
      category,
      description,
      date,
      paymentMethod,
      location,
      merchant,
      isEssential,
      isRecurring,
      recurrenceType,
      status,
      tags,
      notes
    } = req.body

    // Find the expense
    const expense = await Expense.findOne({ _id: id, userId: req.user.id })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      })
    }

    // Store old amount for user balance update
    const oldAmount = expense.amount

    // Update fields if provided
    if (amount !== undefined) expense.amount = parseFloat(amount)
    if (category !== undefined) expense.category = category
    if (description !== undefined) expense.description = description
    if (date !== undefined) expense.date = date
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod
    if (location !== undefined) expense.location = location
    if (merchant !== undefined) expense.merchant = merchant
    if (isEssential !== undefined) expense.isEssential = isEssential
    if (isRecurring !== undefined) expense.isRecurring = isRecurring
    if (recurrenceType !== undefined) expense.recurrenceType = recurrenceType
    if (status !== undefined) expense.status = status
    if (tags !== undefined) expense.tags = tags
    if (notes !== undefined) expense.notes = notes

    // Save updated expense
    const updatedExpense = await expense.save()

    // Update user balance if amount changed
    if (amount !== undefined && oldAmount !== parseFloat(amount)) {
      const user = await User.findById(req.user.id)
      user.balance = user.balance + oldAmount - parseFloat(amount)
      user.totalExpense = user.totalExpense - oldAmount + parseFloat(amount)
      await user.save()
    }

    // Trigger AI analysis in background
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: updatedExpense,
      balanceUpdated: amount !== undefined,
      aiAnalysisTriggered: isAIAvailable()
    })
  } catch (error) {
    console.error('Update expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 11: DELETE EXPENSE using "/api/expense/delete/:id" LOGIN REQUIRED
router.delete('/delete/:id', fetchuser, async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      })
    }

    // Store amount for user balance update
    const amount = expense.amount

    // Delete the expense
    await Expense.findByIdAndDelete(req.params.id)

    // Update user balance and stats
    const user = await User.findById(req.user.id)
    user.balance += amount
    user.totalExpense = Math.max((user.totalExpense || 0) - amount, 0)
    user.expenseCount = Math.max((user.expenseCount || 0) - 1, 0)
    await user.save()

    // Trigger AI analysis in background
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Expense deleted successfully',
      data: {
        deletedAmount: amount,
        newBalance: user.balance
      },
      aiAnalysisTriggered: isAIAvailable()
    })
  } catch (error) {
    console.error('Delete expense error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

module.exports = router
