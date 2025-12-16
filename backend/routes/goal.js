const express = require('express')
const User = require('../123/User')
const Goal = require('../123/Goal')
const Income = require('../123/Income') // Add this
const Expense = require('../123/Expense') // Add this
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

const getGoalAIInsights = async (goals, incomes, expenses) => {
  loadAIServices() // Load only when called

  if (FinancialAIService && goals.length > 0) {
    try {
      const aiService = new FinancialAIService()
      return aiService.analyzeGoalProgress(goals, incomes || [], expenses || [])
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

// ROUTE 1: ADD GOAL using "/api/goal/add" LOGIN REQUIRED
router.post('/add', fetchuser, [
  body('title', 'Title must be at least 3 characters').isLength({ min: 3 }),
  body('targetAmount', 'Target amount must be a positive number').isFloat({ min: 1 }),
  body('deadline', 'Deadline is required').isISO8601().toDate(),
  body('priorityLevel', 'Priority level must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('category', 'Invalid category').optional().isIn(['Emergency Fund', 'Car', 'House', 'Travel', 'Education', 'Retirement', 'Wedding', 'Business', 'Gadgets', 'Health', 'Other']),
  body('difficulty', 'Invalid difficulty level').optional().isIn(['Easy', 'Medium', 'Hard', 'Very Hard']),
  body('riskLevel', 'Invalid risk level').optional().isIn(['Low', 'Medium', 'High']),
  body('deductPercentage', 'Deduct percentage must be between 0 and 100').optional().isFloat({ min: 0, max: 100 })
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
      title,
      desc,
      priorityLevel,
      targetAmount,
      category,
      deadline,
      difficulty,
      riskLevel,
      tags,
      autoDeduct,
      deductPercentage,
      notes
    } = req.body

    // Validate priorityLevel
    let priority = 3 // Default medium priority
    if (priorityLevel !== undefined) {
      priority = Math.min(Math.max(parseInt(priorityLevel), 1), 5)
    }

    const goal = new Goal({
      title,
      desc: desc || '',
      priorityLevel: priority,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      category: category || 'general',
      deadline,
      userId: req.user.id,
      difficulty: difficulty || 'Medium',
      riskLevel: riskLevel || 'Medium',
      tags: tags || [],
      autoDeduct: autoDeduct || false,
      deductPercentage: deductPercentage || 10,
      notes: notes || ''
    })

    // Add Goal - middleware will calculate progress, remainingAmount, etc.
    const savedGoal = await goal.save()

    // Update User Goal Count
    const user = await User.findById(req.user.id)
    user.goalCount = (user.goalCount || 0) + 1
    await user.save()

    // Trigger AI analysis in background
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Goal added successfully',
      data: savedGoal
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

// ROUTE 2: GET ALL GOALS using "/api/goal/all" LOGIN REQUIRED
router.get('/all', fetchuser, async (req, res) => {
  try {
    const {
      status,
      category,
      priority,
      isCompleted,
      difficulty,
      limit,
      page
    } = req.query

    const userId = req.user.id
    const query = { userId }

    // Apply filters
    if (status) query.status = status
    if (category) query.category = category
    if (priority) query.priorityLevel = parseInt(priority)
    if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true'
    if (difficulty) query.difficulty = difficulty

    // Pagination
    const pageNumber = parseInt(page) || 1
    const pageSize = parseInt(limit) || 10
    const skip = (pageNumber - 1) * pageSize

    const goals = await Goal.find(query).sort({
      priorityLevel: -1, // Higher priority first
      createdAt: -1
    }).skip(skip).limit(pageSize)

    if (goals.length === 0) {
      return res.json({
        success: true,
        message: 'No goals found',
        data: [],
        stats: {
          totalGoals: 0,
          completedGoals: 0,
          totalTarget: 0,
          totalSaved: 0,
          overallProgress: 0
        }
      })
    }

    // Calculate statistics
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.isCompleted).length,
      totalTarget: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      totalSaved: goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0),
      overallProgress: 0
    }

    if (stats.totalTarget > 0) {
      stats.overallProgress = (stats.totalSaved / stats.totalTarget) * 100
    }

    // Get AI insights if available
    const aiInsights = await getGoalAIInsights(goals)

    res.json({
      success: true,
      message: 'Goals fetched successfully',
      data: goals,
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

// ROUTE 9: GET GOAL AI INSIGHTS using "/api/goal/ai-insights" LOGIN REQUIRED
router.get('/ai-insights', fetchuser, async (req, res) => {
  try {
    if (!isAIAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'AI Service is not available'
      })
    }

    const goals = await Goal.find({ userId: req.user.id })

    if (goals.length === 0) {
      return res.json({
        success: true,
        message: 'No goals found for AI analysis',
        data: {
          insights: ['Set financial goals to get AI insights'],
          suggestions: ['Start by adding your first financial goal']
        }
      })
    }

    // Get income and expense data for better AI analysis
    let incomes = []
    let expenses = []

    try {
      // Use already-loaded models
      [incomes, expenses] = await Promise.all([
        Income.find({ userId: req.user.id }).lean(),
        Expense.find({ userId: req.user.id }).lean()
      ])
    } catch (modelError) {
      console.log('Could not load income/expense data for AI:', modelError.message)
      // Continue without income/expense data
    }

    const aiInsights = await getGoalAIInsights(goals, incomes, expenses)

    res.json({
      success: true,
      message: 'Goal AI Insights generated',
      data: aiInsights,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Insights Error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 3: GET SINGLE GOAL using "/api/goal/:id" LOGIN REQUIRED
router.get('/:id', fetchuser, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    res.json({
      success: true,
      message: 'Goal fetched successfully',
      data: goal
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

// ROUTE 4: UPDATE GOAL using "/api/goal/update/:id" LOGIN REQUIRED
router.put('/update/:id', fetchuser, [
  body('priorityLevel', 'Priority level must be between 1 and 5').optional().isInt({ min: 1, max: 5 }),
  body('targetAmount', 'Target amount must be a positive number').optional().isFloat({ min: 1 }),
  body('deadline', 'Invalid date format').optional().isISO8601().toDate(),
  body('currentAmount', 'Current amount must be a non-negative number').optional().isFloat({ min: 0 }),
  body('category', 'Invalid category').optional().isIn(['Emergency Fund', 'Car', 'House', 'Travel', 'Education', 'Retirement', 'Wedding', 'Business', 'Gadgets', 'Health', 'Other']),
  body('difficulty', 'Invalid difficulty level').optional().isIn(['Easy', 'Medium', 'Hard', 'Very Hard']),
  body('status', 'Invalid status').optional().isIn(['Not Started', 'In Progress', 'Almost There', 'Completed', 'Behind Schedule']),
  body('riskLevel', 'Invalid risk level').optional().isIn(['Low', 'Medium', 'High']),
  body('deductPercentage', 'Deduct percentage must be between 0 and 100').optional().isFloat({ min: 0, max: 100 })
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

    // Find the goal
    const goal = await Goal.findOne({ _id: id, userId: req.user.id })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    // Update fields from request body
    const updatableFields = [
      'title', 'desc', 'priorityLevel', 'targetAmount',
      'category', 'deadline', 'currentAmount', 'notes',
      'difficulty', 'status', 'riskLevel', 'tags',
      'autoDeduct', 'deductPercentage'
    ]

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'priorityLevel' && req.body[field] !== undefined) {
          // Ensure priority level is between 1-5
          goal[field] = Math.min(Math.max(parseInt(req.body[field]), 1), 5)
        } else {
          goal[field] = req.body[field]
        }
      }
    })

    // Ensure currentAmount is never negative
    if (goal.currentAmount < 0) {
      goal.currentAmount = 0
    }

    // Save the updated goal (middleware will auto-calculate everything)
    const updatedGoal = await goal.save()

    // Trigger AI analysis
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Goal updated successfully',
      data: updatedGoal,
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

// ROUTE 5: MARK GOAL AS COMPLETE using "/api/goal/complete/:id" LOGIN REQUIRED
router.put('/complete/:id', fetchuser, async (req, res) => {
  try {
    const { id } = req.params

    // Find the goal
    const goal = await Goal.findOne({ _id: id, userId: req.user.id })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    // If already completed
    if (goal.isCompleted) {
      return res.json({
        success: true,
        message: 'Goal is already completed',
        data: goal
      })
    }

    try {
      // Mark as complete by setting current amount to target amount
      goal.currentAmount = goal.targetAmount
      goal.status = 'Completed'

      // Save (middleware will handle the rest)
      await goal.save()

      // Refresh to get updated document
      const completedGoal = await Goal.findById(id)

      // Trigger AI analysis
      triggerAIAnalysis(req.user.id)

      res.json({
        success: true,
        message: 'Goal marked as complete successfully',
        data: completedGoal,
        aiAnalysisTriggered: isAIAvailable()
      })
    } catch (saveError) {
      console.error('Error completing goal:', saveError.message)
      return res.status(500).json({
        success: false,
        message: 'Failed to complete goal',
        error: saveError.message
      })
    }
  } catch (error) {
    console.error('Error completing goal:', error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 6: DELETE GOAL using "/api/goal/delete/:id" LOGIN REQUIRED
router.delete('/delete/:id', fetchuser, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    // Delete the goal
    await Goal.findByIdAndDelete(req.params.id)

    // Update user goal count
    const user = await User.findById(req.user.id)
    if (user.goalCount > 0) {
      user.goalCount -= 1
      await user.save()
    }

    // Trigger AI analysis
    triggerAIAnalysis(req.user.id)

    return res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
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

// ROUTE 7: ADD TO GOAL SAVINGS using "/api/goal/add-savings/:id" LOGIN REQUIRED
router.put('/add-savings/:id', fetchuser, [
  body('amount', 'Amount must be a positive number').isFloat({ min: 1 })
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
    const { amount } = req.body

    // Find the goal
    const goal = await Goal.findOne({ _id: id, userId: req.user.id })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    // If already completed
    if (goal.isCompleted) {
      return res.status(400).json({
        success: false,
        message: 'Goal is already completed'
      })
    }

    try {
      // Use the instance method to add amount
      await goal.addAmount(parseFloat(amount))

      // Refresh the goal to get updated data
      const updatedGoal = await Goal.findById(id)

      // Trigger AI analysis
      triggerAIAnalysis(req.user.id)

      res.json({
        success: true,
        message: 'Savings added to goal successfully',
        data: updatedGoal,
        aiAnalysisTriggered: isAIAvailable()
      })
    } catch (saveError) {
      console.error('Error saving goal:', saveError.message)
      return res.status(500).json({
        success: false,
        message: 'Failed to save goal changes',
        error: saveError.message
      })
    }
  } catch (error) {
    console.error('Error adding savings:', error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    })
  }
})

// ROUTE 8: GET GOAL STATISTICS using "/api/goal/stats" LOGIN REQUIRED
router.get('/stats', fetchuser, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id })

    if (goals.length === 0) {
      return res.json({
        success: true,
        message: 'No goals found',
        data: {
          totalGoals: 0,
          completedGoals: 0,
          inProgressGoals: 0,
          totalTargetAmount: 0,
          totalCurrentAmount: 0,
          totalRemainingAmount: 0,
          overallProgress: 0,
          averagePriority: 0,
          byCategory: {},
          byPriority: {},
          byStatus: {},
          byDifficulty: {}
        }
      })
    }

    // Calculate basic statistics
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.isCompleted).length,
      inProgressGoals: goals.filter(g => !g.isCompleted).length,
      totalTargetAmount: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
      totalCurrentAmount: goals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0),
      totalRemainingAmount: 0,
      overallProgress: 0,
      averagePriority: 0,
      byCategory: {},
      byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byStatus: {},
      byDifficulty: {}
    }

    // Calculate remaining amount and overall progress
    stats.totalRemainingAmount = stats.totalTargetAmount - stats.totalCurrentAmount
    if (stats.totalTargetAmount > 0) {
      stats.overallProgress = (stats.totalCurrentAmount / stats.totalTargetAmount) * 100
    }

    // Calculate average priority
    const totalPriority = goals.reduce((sum, goal) => sum + (goal.priorityLevel || 3), 0)
    stats.averagePriority = totalPriority / goals.length

    // Group goals
    goals.forEach(goal => {
      // Group by category
      const category = goal.category || 'general'
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

      // Group by priority level
      const priority = goal.priorityLevel || 3
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1

      // Group by status
      const status = goal.status || 'Not Started'
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

      // Group by difficulty
      const difficulty = goal.difficulty || 'Medium'
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1
    })

    // Get total monthly savings needed
    const monthlySavingsRequired = await Goal.getMonthlySavingsRequired(req.user.id)
    if (monthlySavingsRequired.length > 0) {
      stats.totalMonthlyNeeded = monthlySavingsRequired[0].totalMonthlyNeeded || 0
      stats.averageMonthlyNeeded = monthlySavingsRequired[0].avgMonthlyNeeded || 0
    }

    res.json({
      success: true,
      message: 'Goal statistics fetched successfully',
      data: stats
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

// ROUTE 10: ADD MILESTONE to GOAL using "/api/goal/add-milestone/:id" LOGIN REQUIRED
router.post('/add-milestone/:id', fetchuser, [
  body('amount', 'Amount must be a positive number').isFloat({ min: 1 }),
  body('description', 'Description is required').notEmpty()
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
    const { amount, description } = req.body

    const goal = await Goal.findOne({ _id: id, userId: req.user.id })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    // Add milestone using instance method
    await goal.addMilestone(parseFloat(amount), description)

    // Trigger AI analysis
    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: 'Milestone added successfully',
      data: goal,
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

// ROUTE 11: TOGGLE AUTO-DEDUCT for GOAL using "/api/goal/toggle-auto-deduct/:id" LOGIN REQUIRED
router.put('/toggle-auto-deduct/:id', fetchuser, async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id
    })

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      })
    }

    goal.autoDeduct = !goal.autoDeduct
    const updatedGoal = await goal.save()

    triggerAIAnalysis(req.user.id)

    res.json({
      success: true,
      message: `Auto-deduct ${updatedGoal.autoDeduct ? 'enabled' : 'disabled'} for goal`,
      data: updatedGoal,
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

// ROUTE 12: GET GOALS BY STATUS using "/api/goal/by-status" LOGIN REQUIRED
router.get('/by-status', fetchuser, async (req, res) => {
  try {
    const goalsByStatus = await Goal.getGoalsByStatus(req.user.id)

    res.json({
      success: true,
      message: 'Goals grouped by status fetched successfully',
      data: goalsByStatus
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

// ROUTE 13: BULK ADD GOALS using "/api/goal/bulk-add" LOGIN REQUIRED
router.post('/bulk-add', fetchuser, [
  body('goals', 'Goals array is required').isArray({ min: 1 }),
  body('goals.*.title', 'Title must be at least 3 characters').isLength({ min: 3 }),
  body('goals.*.targetAmount', 'Target amount must be a positive number').isFloat({ min: 1 }),
  body('goals.*.deadline', 'Deadline is required').isISO8601().toDate()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      })
    }

    const { goals } = req.body
    const userId = req.user.id

    const formattedGoals = goals.map(goal => ({
      title: goal.title,
      desc: goal.desc || '',
      priorityLevel: Math.min(Math.max(parseInt(goal.priorityLevel || 3), 1), 5),
      targetAmount: parseFloat(goal.targetAmount),
      currentAmount: 0,
      category: goal.category || 'general',
      deadline: goal.deadline,
      userId,
      difficulty: goal.difficulty || 'Medium',
      riskLevel: goal.riskLevel || 'Medium',
      tags: goal.tags || [],
      autoDeduct: goal.autoDeduct || false,
      deductPercentage: goal.deductPercentage || 10,
      notes: goal.notes || ''
    }))

    const savedGoals = await Goal.insertMany(formattedGoals)

    // Update user goal count
    const user = await User.findById(userId)
    user.goalCount = (user.goalCount || 0) + savedGoals.length
    await user.save()

    // Trigger AI analysis
    triggerAIAnalysis(userId)

    res.json({
      success: true,
      message: `${savedGoals.length} goals added successfully`,
      data: {
        count: savedGoals.length,
        goals: savedGoals
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
