// routes/aiRoutes.js
const express = require('express')
const router = express.Router()
const fetchuser = require('../middleware/fetchuser')
const FinancialAIService = require('../services/FinancialAIService')
const Income = require('../models/Income')
const Expense = require('../models/Expense')
const Goal = require('../models/Goal')

// Initialize AI Service
const aiService = new FinancialAIService()

// ROUTE 1: GET FINANCIAL ANALYSIS
router.get('/analysis', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id

    // Fetch user data
    const [incomes, expenses, goals] = await Promise.all([
      Income.find({ userId }),
      Expense.find({ userId }),
      Goal.find({ userId })
    ])

    // Analyze with AI
    const analysis = await aiService.analyzeUserFinances(userId, incomes, expenses, goals)

    res.json(analysis)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

// ROUTE 2: GET SPENDING INSIGHTS
router.get('/spending-insights', fetchuser, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id })
    const analysis = aiService.analyzeSpendingPatterns(expenses)

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

// ROUTE 3: GET GOAL RECOMMENDATIONS
router.get('/goal-recommendations', fetchuser, async (req, res) => {
  try {
    const [incomes, expenses, goals] = await Promise.all([
      Income.find({ userId: req.user.id }),
      Expense.find({ userId: req.user.id }),
      Goal.find({ userId: req.user.id })
    ])

    const analysis = aiService.analyzeGoalProgress(goals, incomes, expenses)

    res.json({
      success: true,
      data: analysis
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

// ROUTE 4: GET FINANCIAL HEALTH SCORE
router.get('/health-score', fetchuser, async (req, res) => {
  try {
    const [incomes, expenses, goals] = await Promise.all([
      Income.find({ userId: req.user.id }),
      Expense.find({ userId: req.user.id }),
      Goal.find({ userId: req.user.id })
    ])

    const score = aiService.calculateFinancialHealth(incomes, expenses, goals)

    res.json({
      success: true,
      data: score
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

// ROUTE 5: GET PERSONALIZED TIPS
router.get('/personal-tips', fetchuser, async (req, res) => {
  try {
    const [incomes, expenses, goals] = await Promise.all([
      Income.find({ userId: req.user.id }),
      Expense.find({ userId: req.user.id }),
      Goal.find({ userId: req.user.id })
    ])

    const tips = aiService.getPersonalizedRecommendations({
      incomes,
      expenses,
      goals
    })

    res.json({
      success: true,
      data: {
        tips,
        count: tips.length
      }
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

// ROUTE 6: PREDICT MONTHLY SAVINGS
router.get('/predict-savings', fetchuser, async (req, res) => {
  try {
    const [incomes, expenses] = await Promise.all([
      Income.find({ userId: req.user.id }),
      Expense.find({ userId: req.user.id })
    ])

    const monthlyIncome = aiService.calculateMonthlyIncome(incomes)
    const monthlyExpense = aiService.calculateMonthlyExpense(expenses)
    const currentSavings = monthlyIncome - monthlyExpense

    // Simple prediction: next month's savings (assuming similar pattern)
    const prediction = {
      currentMonth: {
        income: monthlyIncome,
        expense: monthlyExpense,
        savings: currentSavings
      },
      nextMonth: {
        income: monthlyIncome * 1.02, // 2% increase prediction
        expense: monthlyExpense * 0.98, // 2% decrease prediction
        savings: (monthlyIncome * 1.02) - (monthlyExpense * 0.98)
      },
      suggestion: currentSavings > 0 
                ? 'Keep up the good savings habit!' 
                : 'Try to reduce expenses by 10% next month'
    }

    res.json({
      success: true,
      data: prediction
    })
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
})

module.exports = router
