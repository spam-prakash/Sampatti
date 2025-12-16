import React, { useState, useEffect } from 'react'
import {
  FaLightbulb,
  FaChartPie,
  FaBullseye,
  FaExclamationTriangle,
  FaRobot,
  FaSync,
  FaArrowUp,
  FaTrophy
} from 'react-icons/fa'
import Loader from '../common/Loader'
import userService from '../../services/userService'
import toast from 'react-hot-toast'

const AIInsightsCard = ({ insights, healthScore }) => {
  const [loading, setLoading] = useState(false)
  const [aiData, setAiData] = useState(null)
  const [expandedInsight, setExpandedInsight] = useState(null)

  useEffect(() => {
    fetchAIData()
  }, [])

  const fetchAIData = async () => {
    try {
      setLoading(true)
      const response = await userService.getAIAnalysis()
      if (response.success) {
        setAiData(response.data || response)
      }
    } catch (error) {
      console.error('Failed to fetch AI data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshInsights = async () => {
    setLoading(true)
    try {
      await userService.triggerAIAnalysis()
      toast.success('AI analysis refreshed!')
      fetchAIData()
    } catch (error) {
      toast.error('Failed to refresh insights')
    } finally {
      setLoading(false)
    }
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getHealthText = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  const getHealthBgColor = (score) => {
    if (score >= 80) return 'bg-green-50'
    if (score >= 60) return 'bg-blue-50'
    if (score >= 40) return 'bg-yellow-50'
    return 'bg-red-50'
  }

  // Sample insights if none available
  const defaultInsights = [
    '💡 You\'re spending 35% on food. Consider meal planning to reduce costs.',
    '🎯 You\'re 45% towards your vacation goal. Keep it up!',
    '⚠️ Your essential expenses are 40% of income. Maintain this ratio.',
    '📈 Your spending has decreased by 12% this month compared to last month.',
    '🏦 Consider building an emergency fund covering 3-6 months of expenses.'
  ]

  const displayedInsights = (aiData?.insights || aiData?.suggestions || insights || defaultInsights).slice(0, 3)
  const finalHealthScore = healthScore || aiData?.score || aiData?.financialHealth?.score || 75

  return (
    <div className={`card mb-8 ${getHealthBgColor(finalHealthScore)}`}>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center'>
          <FaRobot className='w-6 h-6 text-primary-600 mr-3' />
          <h3 className='text-lg font-semibold text-gray-900'>AI Financial Insights</h3>
        </div>
        <button
          onClick={handleRefreshInsights}
          disabled={loading}
          className='flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium transition'
        >
          <FaSync className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {loading && <Loader size='sm' />}

      {!loading && (
        <>
          {/* Financial Health Score */}
          <div className='mb-6 bg-white p-4 rounded-lg'>
            <div className='flex items-center justify-between mb-3'>
              <div>
                <h4 className='font-semibold text-gray-900'>Financial Health Score</h4>
                <p className='text-xs text-gray-600'>AI-powered assessment</p>
              </div>
              <div className='text-right'>
                <div className={`text-3xl font-bold ${getHealthColor(finalHealthScore)}`}>
                  {finalHealthScore}/100
                </div>
                <div className='text-xs text-gray-600'>{getHealthText(finalHealthScore)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className='w-full bg-gray-200 rounded-full h-3'>
              <div
                className={`h-3 rounded-full transition-all ${
                  finalHealthScore >= 80
                    ? 'bg-green-600'
                    : finalHealthScore >= 60
                    ? 'bg-blue-600'
                    : finalHealthScore >= 40
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(finalHealthScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Key Metrics */}
          {aiData?.userProfile && (
            <div className='grid grid-cols-3 gap-2 mb-6'>
              <div className='bg-white p-3 rounded-lg text-center'>
                <p className='text-xs text-gray-600'>Monthly Income</p>
                <p className='text-sm font-semibold text-gray-900'>
                  ₹{(aiData.userProfile.monthlyIncome || 0).toLocaleString()}
                </p>
              </div>
              <div className='bg-white p-3 rounded-lg text-center'>
                <p className='text-xs text-gray-600'>Savings Rate</p>
                <p className='text-sm font-semibold text-green-600'>
                  {aiData.savingsRate || '0'}%
                </p>
              </div>
              <div className='bg-white p-3 rounded-lg text-center'>
                <p className='text-xs text-gray-600'>Top Category</p>
                <p className='text-sm font-semibold text-gray-900'>
                  {aiData.topCategory || 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Insights List */}
          <div className='space-y-3 mb-6'>
            <h4 className='font-semibold text-gray-900 flex items-center gap-2'>
              <FaLightbulb className='w-4 h-4' />
              AI Recommendations
            </h4>
            {displayedInsights && displayedInsights.length > 0
              ? (
                  displayedInsights.map((insight, index) => (
                    <div
                      key={index}
                      className='p-3 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors'
                    >
                      <div className='flex items-start gap-2'>
                        <div className='flex-shrink-0 mt-0.5'>
                          {insight.toLowerCase().includes('reduce') ||
                      insight.toLowerCase().includes('urgent') ||
                      insight.toLowerCase().includes('⚠️')
                            ? (
                          <FaExclamationTriangle className='w-4 h-4 text-orange-500' />
                              )
                            : insight.toLowerCase().includes('spending') ||
                        insight.toLowerCase().includes('💡')
                              ? (
                            <FaChartPie className='w-4 h-4 text-blue-500' />
                                )
                              : insight.toLowerCase().includes('goal') ||
                        insight.toLowerCase().includes('🎯')
                                ? (
                              <FaBullseye className='w-4 h-4 text-purple-500' />
                                  )
                                : insight.toLowerCase().includes('trend') ||
                        insight.toLowerCase().includes('📈')
                                  ? (
                                <FaArrowUp className='w-4 h-4 text-green-500' />
                                    )
                                  : (
                                <FaTrophy className='w-4 h-4 text-yellow-500' />
                                    )}
                        </div>
                        <p className='text-sm text-gray-800 flex-1 leading-relaxed'>
                          {expandedInsight === index
                            ? insight
                            : insight.length > 90
                              ? `${insight.substring(0, 90)}...`
                              : insight}
                        </p>
                      </div>
                    </div>
                  ))
                )
              : (
                <div className='text-center py-6 bg-white rounded-lg'>
                  <FaLightbulb className='w-8 h-8 text-gray-300 mx-auto mb-2' />
                  <p className='text-sm text-gray-600'>
                    Add transactions to get personalized insights.
                  </p>
                </div>
                )}
          </div>

          {/* Tips Section */}
          <div className='bg-white p-3 rounded-lg border border-primary-200'>
            <p className='text-xs font-semibold text-primary-700 mb-2 flex items-center gap-1'>
              <FaBullseye className='w-3 h-3' />
              AI Tip of the Day
            </p>
            <p className='text-xs text-gray-700'>
              Review your spending habits weekly and set realistic budget goals. Small changes in daily spending can lead to significant savings over time.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default AIInsightsCard
