// services/FinancialAIService.js
const { GoogleGenerativeAI } = require('@google/generative-ai')
class FinancialAIService {
  constructor () {
    this.categories = {
      income: ['Salary', 'Freelance', 'Business', 'Investment', 'Other'],
      expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'],
      goal: ['Car', 'House', 'Travel', 'Education', 'Emergency', 'Retirement', 'Other']
    }

    // Initialize Gemini AI
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

    // FIX: Use a currently available Gemini model
    // Options: 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro-latest', etc.
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite' // Use a current model name
    })
  }

  // NEW: CHATBOT INTEGRATION
  async chatWithUser (userMessage, userData, history = []) {
    try {
      const { incomes = [], expenses = [], goals = [] } = userData

      const health = this.calculateFinancialHealth(incomes, expenses, goals)
      const spending = this.analyzeSpendingPatterns(expenses)
      const mIncome = this.calculateMonthlyIncome(incomes)
      const mExpense = this.calculateMonthlyExpense(expenses)

      const systemContext = `
    You are 'Sampatti AI', a professional financial advisor.
    User's Financial Profile:
    - Health Score: ${health.score}/100 (Rating: ${health.rating})
    - Monthly Income: ₹${mIncome}
    - Monthly Expense: ₹${mExpense}
    - Monthly Savings: ₹${mIncome - mExpense}
    - Top Expense Category: ${spending.topCategory || 'None'}
    - Active Goals: ${goals.length > 0 ? goals.map(g => g.title).join(', ') : 'None'}

    Guidelines:
    - Be concise and professional.
    - Use specific numbers provided above.
    - Use ₹ (Rupee symbol) for currency.
  `

      // FIX: Using generateContent directly is less prone to 404 errors than startChat
      const prompt = `System: ${systemContext}\n\nUser Question: ${userMessage}`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('GENAI ERROR:', error.message)
      // Dynamic Fallback: Shows that data fetching IS working even if AI is down
      const mIn = userData.incomes.reduce((s, i) => s + i.amount, 0)
      const mOut = userData.expenses.reduce((s, e) => s + e.amount, 0)
      return `I can see your ${userData.incomes.length} incomes (₹${mIn}) and ${userData.expenses.length} expenses (₹${mOut}), but I'm having trouble connecting to my AI core right now.`
    }
  }

  // 1. ANALYZE SPENDING PATTERNS
  analyzeSpendingPatterns (expenses) {
    if (!expenses || expenses.length === 0) {
      return {
        message: 'No expense data available for analysis',
        suggestions: ['Start tracking your expenses to get insights']
      }
    }

    // Group by category
    const categoryTotals = {}
    let totalSpent = 0

    expenses.forEach(expense => {
      const category = expense.category || 'Other'
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0
      }
      categoryTotals[category] += expense.amount
      totalSpent += expense.amount
    })

    // Find top spending categories
    const sortedCategories = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent * 100).toFixed(1)
      }))
      .sort((a, b) => b.amount - a.amount)

    const topCategory = sortedCategories[0]
    const insights = []

    // Generate insights based on spending
    if (topCategory && topCategory.percentage > 40) {
      insights.push(`You're spending ${topCategory.percentage}% on ${topCategory.category}. Consider reducing this.`)
    }

    if (totalSpent > 0) {
      const avgDaily = totalSpent / 30
      insights.push(`You're spending ₹${avgDaily.toFixed(0)} daily on average.`)
    }

    return {
      totalSpent,
      categoryBreakdown: sortedCategories,
      topCategory: topCategory ? topCategory.category : null,
      insights,
      suggestions: this.getSpendingSuggestions(sortedCategories)
    }
  }

  // 2. ANALYZE INCOME PATTERNS
  analyzeIncomePatterns (incomes) {
    if (!incomes || incomes.length === 0) {
      return {
        message: 'No income data available',
        suggestions: ['Add your income sources to get better insights']
      }
    }

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)
    const avgIncome = totalIncome / incomes.length
    const incomeSources = {}

    incomes.forEach(income => {
      const source = income.category || 'Other'
      if (!incomeSources[source]) {
        incomeSources[source] = 0
      }
      incomeSources[source] += income.amount
    })

    const insights = []
    if (Object.keys(incomeSources).length === 1) {
      insights.push('You have only one income source. Consider diversifying.')
    }

    return {
      totalIncome,
      averageIncome: avgIncome,
      incomeSources,
      insights,
      suggestions: ['Try to increase passive income sources', 'Consider freelance work for extra income']
    }
  }

  // 3. ANALYZE GOAL PROGRESS
  analyzeGoalProgress (goals, incomes, expenses) {
    if (!goals || goals.length === 0) {
      return {
        message: 'No goals set yet',
        suggestions: ['Set financial goals to stay motivated']
      }
    }

    const totalMonthlyIncome = this.calculateMonthlyIncome(incomes)
    const totalMonthlyExpense = this.calculateMonthlyExpense(expenses)
    const monthlySavings = totalMonthlyIncome - totalMonthlyExpense

    const analyzedGoals = goals.map(goal => {
      const remaining = goal.targetAmount - (goal.currentAmount || 0)
      const monthsNeeded = monthlySavings > 0 ? remaining / monthlySavings : 999
      const progress = goal.targetAmount > 0
        ? ((goal.currentAmount || 0) / goal.targetAmount * 100).toFixed(1)
        : 0

      let status = 'on-track'
      if (progress >= 100) status = 'completed'
      else if (monthsNeeded > 12) status = 'needs-attention'
      else if (monthsNeeded > 24) status = 'critical'

      return {
        title: goal.title,
        progress: parseFloat(progress),
        remainingAmount: remaining,
        monthsNeeded: Math.ceil(monthsNeeded),
        status,
        suggestion: this.getGoalSuggestion(goal, monthlySavings)
      }
    })

    const completedGoals = analyzedGoals.filter(g => g.progress >= 100).length
    const criticalGoals = analyzedGoals.filter(g => g.status === 'critical').length

    const insights = []
    if (monthlySavings <= 0) {
      insights.push("You're spending more than you earn! Reduce expenses immediately.")
    }
    if (criticalGoals > 0) {
      insights.push(`${criticalGoals} goals need urgent attention.`)
    }

    return {
      totalGoals: goals.length,
      completedGoals,
      criticalGoals,
      monthlySavings,
      goals: analyzedGoals,
      insights,
      suggestions: [
        'Focus on one goal at a time',
        'Increase monthly savings by cutting unnecessary expenses'
      ]
    }
  }

  // 4. GENERATE FINANCIAL HEALTH SCORE (1-100)
  calculateFinancialHealth (incomes, expenses, goals) {
    let score = 50 // Start with average

    // Income factor
    const monthlyIncome = this.calculateMonthlyIncome(incomes)
    if (monthlyIncome > 50000) score += 20
    else if (monthlyIncome > 25000) score += 10

    // Savings factor
    const monthlyExpense = this.calculateMonthlyExpense(expenses)
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0
    if (savingsRate > 0.3) score += 20
    else if (savingsRate > 0.1) score += 10
    else if (savingsRate <= 0) score -= 20

    // Goal factor
    if (goals && goals.length > 0) {
      const completed = goals.filter(g => (g.currentAmount || 0) >= g.targetAmount).length
      const completionRate = goals.length > 0 ? completed / goals.length : 0
      score += completionRate * 10
    }

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score))

    let rating = 'Poor'
    if (score >= 80) rating = 'Excellent'
    else if (score >= 60) rating = 'Good'
    else if (score >= 40) rating = 'Fair'

    return {
      score: Math.round(score),
      rating,
      breakdown: {
        income: monthlyIncome,
        savingsRate: (savingsRate * 100).toFixed(1) + '%',
        monthlySavings: monthlyIncome - monthlyExpense
      }
    }
  }

  // 5. GET PERSONALIZED RECOMMENDATIONS
  getPersonalizedRecommendations (userData) {
    const { incomes, expenses, goals } = userData
    const recommendations = []

    // Check if expenses exist
    if (expenses && expenses.length > 0) {
      const spendingAnalysis = this.analyzeSpendingPatterns(expenses)
      if (spendingAnalysis.topCategory) {
        recommendations.push(`Reduce spending on ${spendingAnalysis.topCategory} by 10%`)
      }
    }

    // Check savings rate
    const monthlyIncome = this.calculateMonthlyIncome(incomes)
    const monthlyExpense = this.calculateMonthlyExpense(expenses)
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0

    if (savingsRate < 0.2) {
      recommendations.push('Aim to save at least 20% of your income')
    }

    // Check emergency fund
    const totalSavings = monthlyIncome - monthlyExpense
    if (totalSavings * 3 < monthlyExpense) {
      recommendations.push('Build an emergency fund covering 3 months of expenses')
    }

    // Check goals
    if (goals && goals.length > 3) {
      recommendations.push('Focus on 2-3 main goals instead of many small ones')
    }

    return recommendations.length > 0
      ? recommendations
      : [
          'Track all your expenses for 30 days',
          'Set a monthly budget',
          'Start with a small saving goal'
        ]
  }

  // HELPER METHODS
  calculateMonthlyIncome (incomes) {
    if (!incomes || incomes.length === 0) return 0
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentIncomes = incomes.filter(income =>
      new Date(income.date || income.createdAt) >= thirtyDaysAgo
    )

    // If no recent data, just return total sum of all incomes so the AI has something to talk about
    return recentIncomes.length > 0
      ? recentIncomes.reduce((sum, income) => sum + income.amount, 0)
      : incomes.reduce((sum, income) => sum + income.amount, 0)
  }

  calculateMonthlyExpense (expenses) {
    if (!expenses || expenses.length === 0) return 0

    // 1. Define the 30-day window
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 2. Filter expenses (Handling different possible date field names)
    const recentExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt || expense.dateTime)
      return expenseDate >= thirtyDaysAgo
    })

    // 3. Logic Fallback:
    // If recentExpenses is empty but expenses array has data,
    // return the sum of all expenses so the AI has data to work with during the hackathon.
    if (recentExpenses.length === 0 && expenses.length > 0) {
      return expenses.reduce((sum, expense) => sum + expense.amount, 0)
    }

    return recentExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  }

  getSpendingSuggestions (categories) {
    const suggestions = []

    categories.forEach(cat => {
      if (cat.category === 'Food' && cat.percentage > 30) {
        suggestions.push('Try cooking at home more often to reduce food expenses')
      }
      if (cat.category === 'Shopping' && cat.percentage > 20) {
        suggestions.push('Wait 24 hours before making non-essential purchases')
      }
      if (cat.category === 'Entertainment' && cat.percentage > 15) {
        suggestions.push('Look for free or low-cost entertainment options')
      }
    })

    return suggestions.length > 0 ? suggestions : ['Your spending looks balanced. Keep it up!']
  }

  getGoalSuggestion (goal, monthlySavings) {
    if (goal.progress >= 100) {
      return 'Goal achieved! Set a new one.'
    }

    const remaining = goal.targetAmount - (goal.currentAmount || 0)
    const monthsNeeded = monthlySavings > 0 ? remaining / monthlySavings : 999

    if (monthsNeeded > 24) {
      return 'This goal will take too long. Consider increasing savings or reducing target.'
    } else if (monthsNeeded > 12) {
      return 'On track but could be faster. Look for ways to save more.'
    } else {
      return 'Good progress! Keep going.'
    }
  }

  // MAIN ANALYSIS FUNCTION
  async analyzeUserFinances (userId, incomeData, expenseData, goalData) {
    try {
      const spendingAnalysis = this.analyzeSpendingPatterns(expenseData)
      const incomeAnalysis = this.analyzeIncomePatterns(incomeData)
      const goalAnalysis = this.analyzeGoalProgress(goalData, incomeData, expenseData)
      const financialHealth = this.calculateFinancialHealth(incomeData, expenseData, goalData)
      const recommendations = this.getPersonalizedRecommendations({
        incomes: incomeData,
        expenses: expenseData,
        goals: goalData
      })

      return {
        success: true,
        userId,
        timestamp: new Date().toISOString(),
        summary: {
          financialHealth,
          monthlyIncome: this.calculateMonthlyIncome(incomeData),
          monthlyExpense: this.calculateMonthlyExpense(expenseData),
          monthlySavings: this.calculateMonthlyIncome(incomeData) - this.calculateMonthlyExpense(expenseData)
        },
        analysis: {
          spending: spendingAnalysis,
          income: incomeAnalysis,
          goals: goalAnalysis
        },
        recommendations: {
          immediate: recommendations.slice(0, 3),
          longTerm: [
            'Invest 20% of savings in mutual funds',
            'Review your budget monthly',
            'Automate your savings'
          ]
        },
        alerts: this.generateAlerts(incomeData, expenseData, goalData)
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      return {
        success: false,
        error: error.message,
        message: 'Analysis failed. Please check your data.'
      }
    }
  }

  generateAlerts (incomes, expenses, goals) {
    const alerts = []

    // Check for high spending
    const today = new Date()
    const weekAgo = new Date(today.setDate(today.getDate() - 7))

    const weeklySpending = expenses
      .filter(e => new Date(e.date || e.createdAt) >= weekAgo)
      .reduce((sum, e) => sum + e.amount, 0)

    if (weeklySpending > 10000) {
      alerts.push({
        type: 'warning',
        message: `High spending this week: ₹${weeklySpending}`,
        priority: 'medium'
      })
    }

    // Check for upcoming goal deadlines
    goals.forEach(goal => {
      if (goal.deadline) {
        const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
        const progress = (goal.currentAmount || 0) / goal.targetAmount * 100

        if (daysLeft < 30 && progress < 50) {
          alerts.push({
            type: 'urgent',
            message: `${goal.title} deadline in ${daysLeft} days! Only ${progress.toFixed(1)}% complete.`,
            priority: 'high'
          })
        }
      }
    })

    return alerts
  }

  // Generate AI-powered financial summary
  generateFinancialSummary (user, incomes, expenses, goals) {
    const monthlyIncome = this.calculateMonthlyIncome(incomes) || user.monthlyIncome || 0
    const monthlyExpense = this.calculateMonthlyExpense(expenses)
    const monthlySavings = monthlyIncome - monthlyExpense
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0

    const health = this.calculateFinancialHealth(incomes, expenses, goals)

    let summary = `Hello ${user.name}, `

    if (savingsRate > 20) {
      summary += `excellent work! You're saving ${savingsRate.toFixed(1)}% of your income. `
    } else if (savingsRate > 0) {
      summary += `good start! You're saving ${savingsRate.toFixed(1)}% of your income. `
    } else {
      summary += 'we need to work on your savings. '
    }

    if (goals && goals.length > 0) {
      const activeGoals = goals.filter(g => g.progress < 100).length
      summary += `You have ${activeGoals} active goals. `
    }

    summary += `Your financial health is ${health.rating.toLowerCase()}.`

    return summary
  }
}

module.exports = FinancialAIService
