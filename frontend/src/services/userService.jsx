import api from './api'

export const userService = {
  // Get AI Analysis
  getAIAnalysis: async () => {
    return await api.get('/ai/analysis')
  },

  // Get Spending Insights
  getSpendingInsights: async () => {
    return await api.get('/ai/spending-insights')
  },

  // Get Income Insights
  getIncomeInsights: async () => {
    return await api.get('/ai/income-insights')
  },

  // Get Financial Health
  getFinancialHealth: async () => {
    return await api.get('/ai/financial-health')
  },

  // Get AI Insights
  getAIInsights: async () => {
    return await api.get('/ai/insights')
  },

  // Get Goal Recommendations
  getGoalRecommendations: async () => {
    return await api.get('/ai/goal-recommendations')
  },

  // Trigger AI Analysis
  triggerAIAnalysis: async () => {
    return await api.get('/ai/analysis')
  },

  // Update preferences
  updatePreferences: async (preferences) => {
    return await api.put('/ai/preferences', preferences)
  },

  // Get spending patterns
  getSpendingPatterns: async () => {
    return await api.get('/ai/spending-patterns')
  },

  // Get savings recommendations
  getSavingsRecommendations: async () => {
    return await api.get('/ai/savings-recommendations')
  }
}

export default userService
