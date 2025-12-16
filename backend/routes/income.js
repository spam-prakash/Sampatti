const express = require('express')
const User = require('../123/User')
const Income = require('../123/Income')
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

const getAIInsights = async (incomes) => {
  loadAIServices() // Load only when called

  if (FinancialAIService && incomes.length > 0) {
    try {
      const aiService = new FinancialAIService()
      return aiService.analyzeIncomePatterns(incomes)
    } catch (aiError) {
      console.error('AI Insights failed:', aiError.message)
    }
  }
  return { message: 'AI analysis not available' }
}

// Helper to check if AI is available
const isAIAvailable = () => {
  loadAIServices()
  return FinancialAIService !== null
}

// ===== ALL ROUTES WITH FIXED AI CHECKS =====

// ROUTE 1: ADD INCOME (with all fields)
router.post('/add', fetchuser, [
  body('amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('category', 'Category is required').notEmpty(),
  body('creditedOn', 'Invalid date format').optional().isISO8601().toDate(),
  body('desc', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('source', 'Source cannot be more than 100 characters').optional().isLength({ max: 100 }),
  body('recurrenceType', 'Invalid recurrence type').optional().isIn(['Daily', 'Weekly', 'Monthly', 'Yearly', null]),
  body('status', 'Invalid status').optional().isIn(['Pending', 'Received', 'Cancelled'])
], async (req, res) => {
  try {
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
      desc,
      creditedOn,
      source,
      isRecurring,
      recurrenceType,
      status,
      tags
    } = req.body

    const income = new Income({
      amount: parseFloat(amount),
      category,
      desc: desc || '',
      creditedOn: creditedOn || new Date(),
      recordedDate: new Date(),
      userId: req.user.id,
      source: source || '',
      isRecurring: isRecurring || false,
      recurrenceType: isRecurring ? recurrenceType : null,
      status: status || 'Received',
      tags: tags || []
    })

    const savedIncome = await income.save()

    const user = await User.findById(req.user.id)
    user.balance += parseFloat(amount)
    user.totalIncome += parseFloat(amount)
    user.incomeCount += 1
    await user.save()

    // Trigger AI analysis (won't block response)
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Income added successfully',
      data: savedIncome,
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

// ROUTE 2: GET ALL INCOMES (with AI insights)
router.get('/all', fetchuser, async (req, res) => {
  try {
    const {
      month,
      year,
      category,
      source,
      isRecurring,
      status,
      limit,
      page
    } = req.query

    const userId = req.user.id
    const query = { userId }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59, 999)
      query.creditedOn = { $gte: startDate, $lte: endDate }
    }

    if (category) query.category = category
    if (source) query.source = source
    if (isRecurring !== undefined) query.isRecurring = isRecurring === 'true'
    if (status) query.status = status

    const pageNumber = parseInt(page) || 1
    const pageSize = parseInt(limit) || 10
    const skip = (pageNumber - 1) * pageSize

    const incomes = await Income.find(query)
      .sort({ creditedOn: -1 })
      .skip(skip)
      .limit(pageSize)

    const totalCount = await Income.countDocuments(query)
    const totalAmount = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])

    const aiInsights = await getAIInsights(incomes)

    const stats = {
      totalCount,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      page: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      pageSize
    }

    res.json({
      success: true,
      message: 'Incomes fetched successfully',
      data: incomes,
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

// ROUTE 3: GET INCOME STATISTICS (FIXED ObjectId issue)
router.get('/stats', fetchuser, async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    const userId = req.user.id

    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.creditedOn = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } else {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      dateFilter.creditedOn = { $gte: startOfMonth, $lte: endOfMonth }
    }

    dateFilter.userId = userId

    const stats = await Income.aggregate([
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
          bySource: { $push: { source: '$source', amount: '$amount' } },
          recurringCount: { $sum: { $cond: [{ $eq: ['$isRecurring', true] }, 1, 0] } }
        }
      }
    ])

    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyTrend = await Income.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId), // FIXED: Use new keyword
          creditedOn: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$creditedOn' },
            month: { $month: '$creditedOn' },
            source: '$source'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])

    const categoryBreakdown = {}
    const sourceBreakdown = {}

    if (stats.length > 0) {
      if (stats[0].byCategory) {
        stats[0].byCategory.forEach(item => {
          if (!categoryBreakdown[item.category]) {
            categoryBreakdown[item.category] = { total: 0, count: 0, average: 0 }
          }
          categoryBreakdown[item.category].total += item.amount
          categoryBreakdown[item.category].count += 1
        })

        Object.keys(categoryBreakdown).forEach(category => {
          categoryBreakdown[category].average =
                        categoryBreakdown[category].total / categoryBreakdown[category].count
        })
      }

      if (stats[0].bySource) {
        stats[0].bySource.forEach(item => {
          const source = item.source || 'Unknown'
          if (!sourceBreakdown[source]) {
            sourceBreakdown[source] = { total: 0, count: 0, average: 0 }
          }
          sourceBreakdown[source].total += item.amount
          sourceBreakdown[source].count += 1
        })

        Object.keys(sourceBreakdown).forEach(source => {
          sourceBreakdown[source].average =
                        sourceBreakdown[source].total / sourceBreakdown[source].count
        })
      }
    }

    const formattedTrend = monthlyTrend.map(item => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
      source: item._id.source || 'Unknown',
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
            recurringCount: stats[0].recurringCount || 0
          }
        : {
            totalAmount: 0,
            averageAmount: 0,
            maxAmount: 0,
            minAmount: 0,
            count: 0,
            recurringCount: 0
          },
      categoryBreakdown,
      sourceBreakdown,
      monthlyTrend: formattedTrend,
      period: {
        startDate: dateFilter.creditedOn.$gte,
        endDate: dateFilter.creditedOn.$lte
      }
    }

    // Add AI insights
    const aiInsights = await getAIInsights(await Income.find(dateFilter))
    result.aiInsights = aiInsights

    res.json({
      success: true,
      message: 'Income statistics fetched successfully',
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

// ROUTE 4: GET INCOME CATEGORIES (FIXED ObjectId issue)
router.get('/categories', fetchuser, async (req, res) => {
  try {
    const categories = await Income.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } }, // FIXED: Use new keyword
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    res.json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
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

// ROUTE 5: GET INCOME SOURCES (FIXED ObjectId issue)
router.get('/sources', fetchuser, async (req, res) => {
  try {
    const sources = await Income.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } }, // FIXED: Use new keyword
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          isRecurring: { $push: '$isRecurring' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    const enrichedSources = sources.map(source => {
      const recurringCount = source.isRecurring.filter(Boolean).length
      return {
        ...source,
        recurringPercentage: (recurringCount / source.count * 100).toFixed(1)
      }
    })

    res.json({
      success: true,
      message: 'Income sources fetched successfully',
      data: enrichedSources
    })
  } catch (error) {
    console.error('Sources error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 6: GET RECURRING INCOME ANALYSIS
router.get('/recurring-analysis', fetchuser, async (req, res) => {
  try {
    const recurringIncomes = await Income.find({
      userId: req.user.id,
      isRecurring: true
    }).sort({ creditedOn: -1 })

    const monthlyRecurring = recurringIncomes.filter(inc =>
      inc.recurrenceType === 'Monthly'
    )

    const weeklyRecurring = recurringIncomes.filter(inc =>
      inc.recurrenceType === 'Weekly'
    )

    const totalMonthlyAmount = monthlyRecurring.reduce((sum, inc) => sum + inc.amount, 0)
    const totalWeeklyAmount = weeklyRecurring.reduce((sum, inc) => sum + inc.amount, 0)

    const predictedMonthlyIncome = totalMonthlyAmount + (totalWeeklyAmount * 4)

    const analysis = {
      totalRecurring: recurringIncomes.length,
      monthlyRecurring: monthlyRecurring.length,
      weeklyRecurring: weeklyRecurring.length,
      totalMonthlyAmount,
      totalWeeklyAmount,
      predictedMonthlyIncome,
      reliability: recurringIncomes.length > 5 ? 'High' : recurringIncomes.length > 2 ? 'Medium' : 'Low',
      suggestions: generateRecurringSuggestions(recurringIncomes)
    }

    res.json({
      success: true,
      message: 'Recurring income analysis fetched',
      data: analysis
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

// Helper function for recurring suggestions
function generateRecurringSuggestions (incomes) {
  const suggestions = []

  if (incomes.length === 0) {
    suggestions.push('Set up recurring income sources for financial stability')
    suggestions.push('Consider salary, rental income, or dividends as recurring sources')
    return suggestions
  }

  const monthlyCount = incomes.filter(inc => inc.recurrenceType === 'Monthly').length
  if (monthlyCount < 2) {
    suggestions.push('Try to establish at least 2 monthly recurring income sources')
  }

  const totalAmount = incomes.reduce((sum, inc) => sum + inc.amount, 0)
  if (totalAmount < 30000) {
    suggestions.push('Your recurring income is low. Consider adding more sources')
  }

  return suggestions.length > 0 ? suggestions : ['Your recurring income looks healthy!']
}

// ROUTE 7: GET AI INCOME INSIGHTS (FIXED AI CHECK)
router.get('/ai-insights', fetchuser, async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI Service is not available'
      })
    }

    const incomes = await Income.find({ userId: req.user.id })

    if (incomes.length === 0) {
      return res.json({
        success: true,
        message: 'No income data available for AI analysis',
        data: {
          analysis: {
            insights: ['Start adding income data to get AI insights'],
            suggestions: ['Add your first income entry']
          }
        }
      })
    }

    const aiService = new FinancialAIService()
    const analysis = aiService.analyzeIncomePatterns(incomes)

    const recurringIncomes = incomes.filter(inc => inc.isRecurring)
    const recurringAmount = recurringIncomes.reduce((sum, inc) => sum + inc.amount, 0)

    const prediction = {
      expectedNextMonth: analysis.totalIncome * 1.02,
      guaranteedRecurring: recurringAmount,
      suggestion: recurringAmount > analysis.totalIncome * 0.5
        ? 'Great! Over 50% of your income is recurring. Focus on increasing passive income.'
        : 'Try to increase recurring income sources for financial stability'
    }

    res.json({
      success: true,
      message: 'AI Income Insights generated',
      data: {
        analysis,
        prediction,
        timestamp: new Date().toISOString()
      }
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

// ROUTE 8: ADD BULK INCOMES (FIXED AI CHECK)
router.post('/bulk-add', fetchuser, [
  body('incomes', 'Incomes array is required').isArray({ min: 1 }),
  body('incomes.*.amount', 'Amount must be a positive number').isFloat({ min: 0.01 }),
  body('incomes.*.category', 'Category is required').notEmpty(),
  body('incomes.*.creditedOn', 'Invalid date format').optional().isISO8601().toDate(),
  body('incomes.*.source', 'Source cannot be more than 100 characters').optional().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { incomes } = req.body
    const userId = req.user.id

    const formattedIncomes = incomes.map(income => ({
      amount: parseFloat(income.amount),
      category: income.category,
      desc: income.desc || '',
      creditedOn: income.creditedOn || new Date(),
      recordedDate: new Date(),
      userId,
      source: income.source || '',
      isRecurring: income.isRecurring || false,
      recurrenceType: income.isRecurring ? income.recurrenceType : null,
      status: income.status || 'Received',
      tags: income.tags || []
    }))

    const savedIncomes = await Income.insertMany(formattedIncomes)

    const totalAmount = formattedIncomes.reduce((sum, income) => sum + income.amount, 0)

    const user = await User.findById(userId)
    user.balance += totalAmount
    user.totalIncome += totalAmount
    user.incomeCount += savedIncomes.length
    await user.save()

    triggerAIAnalysis(userId)

    res.json({
      success: true,
      message: `${savedIncomes.length} incomes added successfully`,
      data: {
        count: savedIncomes.length,
        totalAmount,
        newBalance: user.balance,
        incomes: savedIncomes
      },
      aiAnalysisTriggered: isAIAvailable()
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

// ===== GENERIC ROUTES MUST COME LAST =====

// ROUTE 9: GET SINGLE INCOME
router.get('/:id', fetchuser, async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      })
    }

    res.json({
      success: true,
      message: 'Income fetched successfully',
      data: income
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

// ROUTE 10: UPDATE INCOME (FIXED AI CHECK)
router.put('/update/:id', fetchuser, [
  body('amount', 'Amount must be a positive number').optional().isFloat({ min: 0.01 }),
  body('category', 'Category cannot be empty').optional().notEmpty(),
  body('creditedOn', 'Invalid date format').optional().isISO8601().toDate(),
  body('desc', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('source', 'Source cannot be more than 100 characters').optional().isLength({ max: 100 }),
  body('recurrenceType', 'Invalid recurrence type').optional().isIn(['Daily', 'Weekly', 'Monthly', 'Yearly', null]),
  body('status', 'Invalid status').optional().isIn(['Pending', 'Received', 'Cancelled'])
], async (req, res) => {
  try {
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
      desc,
      creditedOn,
      source,
      isRecurring,
      recurrenceType,
      status,
      tags
    } = req.body

    const income = await Income.findOne({ _id: id, userId: req.user.id })

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      })
    }

    const oldAmount = income.amount

    if (amount !== undefined) income.amount = parseFloat(amount)
    if (category !== undefined) income.category = category
    if (desc !== undefined) income.desc = desc
    if (creditedOn !== undefined) income.creditedOn = creditedOn
    if (source !== undefined) income.source = source
    if (isRecurring !== undefined) income.isRecurring = isRecurring
    if (recurrenceType !== undefined) income.recurrenceType = recurrenceType
    if (status !== undefined) income.status = status
    if (tags !== undefined) income.tags = tags

    const updatedIncome = await income.save()

    if (amount !== undefined && oldAmount !== parseFloat(amount)) {
      const user = await User.findById(req.user.id)
      user.balance = user.balance - oldAmount + parseFloat(amount)
      user.totalIncome = user.totalIncome - oldAmount + parseFloat(amount)
      await user.save()
    }

    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Income updated successfully',
      data: updatedIncome,
      balanceUpdated: amount !== undefined,
      aiAnalysisTriggered: isAIAvailable()
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

// ROUTE 11: DELETE INCOME (FIXED AI CHECK)
router.delete('/delete/:id', fetchuser, async (req, res) => {
  try {
    const income = await Income.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!income) {
      return res.status(404).json({
        success: false,
        message: 'Income not found'
      })
    }

    const amount = income.amount

    await Income.findByIdAndDelete(req.params.id)

    const user = await User.findById(req.user.id)
    user.balance -= amount
    user.totalIncome -= amount
    user.incomeCount = Math.max(user.incomeCount - 1, 0)
    await user.save()

    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Income deleted successfully',
      data: {
        deletedAmount: amount,
        newBalance: user.balance
      },
      aiAnalysisTriggered: isAIAvailable()
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

module.exports = router
