// services/AIAnalyzer.js
const FinancialAIService = require('./FinancialAIService')

class AIAnalyzer {
  constructor () {
    this.aiService = new FinancialAIService()
  }

  async analyzeUserFinances (userId) {
    try {
      // Import models INSIDE the function to avoid circular dependencies
      const Income = require('../models/Income')
      const Expense = require('../models/Expense')
      const Goal = require('../models/Goal')
      const User = require('../models/User')

      // Get user data
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const [incomes, expenses, goals] = await Promise.all([
        Income.find({ userId }),
        Expense.find({ userId }),
        Goal.find({ userId })
      ])

      // Add user's monthly income to analysis
      const userIncomeData = incomes.length > 0
        ? incomes
        : [
            {
              amount: user.monthlyIncome || 0,
              category: user.primaryMOI || 'Salary',
              date: new Date()
            }
          ]

      const analysis = await this.aiService.analyzeUserFinances(
        userId,
        userIncomeData,
        expenses,
        goals
      )

      // Add user-specific data to analysis
      if (analysis.success) {
        analysis.userProfile = {
          monthlyIncome: user.monthlyIncome,
          primaryIncomeSource: user.primaryMOI,
          currency: user.currency,
          savingsTarget: user.savingsTarget
        }
      }

      return analysis
    } catch (error) {
      console.error('AI Analyzer Error:', error)
      return {
        success: false,
        error: error.message,
        message: 'Analysis failed. Please check your data.'
      }
    }
  }

  async getSpendingInsights (userId) {
    try {
      const Expense = require('../models/Expense')
      const expenses = await Expense.find({ userId })
      return this.aiService.analyzeSpendingPatterns(expenses)
    } catch (error) {
      console.error('Spending Insights Error:', error)
      return {
        message: 'Unable to analyze spending patterns',
        error: error.message
      }
    }
  }

  async getFinancialHealth (userId) {
    try {
      const User = require('../models/User')
      const Income = require('../models/Income')
      const Expense = require('../models/Expense')
      const Goal = require('../models/Goal')

      const [user, incomes, expenses, goals] = await Promise.all([
        User.findById(userId),
        Income.find({ userId }),
        Expense.find({ userId }),
        Goal.find({ userId })
      ])

      if (!user) {
        throw new Error('User not found')
      }

      const healthScore = this.aiService.calculateFinancialHealth(
        incomes,
        expenses,
        goals
      )

      return {
        success: true,
        score: healthScore.score,
        rating: healthScore.rating,
        breakdown: healthScore.breakdown,
        lastUpdated: new Date()
      }
    } catch (error) {
      console.error('Financial Health Error:', error)
      return {
        success: false,
        error: error.message,
        score: 0,
        rating: 'Unknown'
      }
    }
  }
}

module.exports = AIAnalyzer
