import React, { useState, useEffect } from 'react'
import {
  FaLightbulb,
  FaChartPie,
  FaBullseye,
  FaExclamationTriangle,
  FaRobot,
  FaSync,
  FaArrowUp,
  FaTrophy,
  FaChevronDown,
  FaChevronUp
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
    if (score >= 80) return 'bg-green-50/50'
    if (score >= 60) return 'bg-blue-50/50'
    if (score >= 40) return 'bg-yellow-50/50'
    return 'bg-red-50/50'
  }

  const defaultInsights = [
    '💡 You\'re spending 35% on food. Consider meal planning to reduce costs.',
    '🎯 You\'re 45% towards your vacation goal. Keep it up!',
    '⚠️ Your essential expenses are 40% of income. Maintain this ratio.'
  ]

  const displayedInsights = (aiData?.insights || aiData?.suggestions || insights || defaultInsights).slice(0, 3)
  const finalHealthScore = healthScore || aiData?.score || aiData?.financialHealth?.score || 75

  return (
    <div className={`rounded-2xl p-5 md:p-6 mb-6 border transition-all duration-300 ${getHealthBgColor(finalHealthScore)} border-gray-100 shadow-sm`}>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-white rounded-lg shadow-sm'>
            <FaRobot className='w-5 h-5 text-blue-600' />
          </div>
          <h3 className='text-base md:text-lg font-bold text-gray-900 tracking-tight'>AI Financial Insights</h3>
        </div>
        <button
          onClick={handleRefreshInsights}
          disabled={loading}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all active:scale-95 disabled:opacity-50'
        >
          <FaSync className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {loading && (
        <div className='py-12 flex flex-col items-center gap-3'>
          <Loader size='md' />
          <p className='text-xs text-gray-400 font-medium animate-pulse'>Gathering financial intelligence...</p>
        </div>
      )}

      {!loading && (
        <div className='space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500'>
          {/* Financial Health Score Box */}
          <div className='bg-white p-5 rounded-xl shadow-sm border border-white'>
            <div className='flex items-end justify-between mb-4'>
              <div>
                <h4 className='text-sm font-bold text-gray-800 mb-0.5'>Health Score</h4>
                <div className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${getHealthBgColor(finalHealthScore)} ${getHealthColor(finalHealthScore)}`}>
                  {getHealthText(finalHealthScore)}
                </div>
              </div>
              <div className='text-right'>
                <span className={`text-3xl md:text-4xl font-black ${getHealthColor(finalHealthScore)}`}>
                  {finalHealthScore}
                </span>
                <span className='text-gray-400 font-bold text-sm'>/100</span>
              </div>
            </div>

            <div className='relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  finalHealthScore >= 80
? 'bg-green-500' 
                  : finalHealthScore >= 60
? 'bg-blue-500' 
                  : finalHealthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(finalHealthScore, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            <div className='bg-white/60 p-3 rounded-xl border border-white/50'>
              <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1'>Monthly Income</p>
              <p className='text-sm font-bold text-gray-900'>
                ₹{(aiData?.userProfile?.monthlyIncome || 0).toLocaleString()}
              </p>
            </div>
            <div className='bg-white/60 p-3 rounded-xl border border-white/50'>
              <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1'>Savings Rate</p>
              <p className='text-sm font-bold text-green-600'>
                {aiData?.savingsRate || '0'}%
              </p>
            </div>
            <div className='bg-white/60 p-3 rounded-xl border border-white/50 col-span-2 md:col-span-1'>
              <p className='text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1'>Top Spending</p>
              <p className='text-sm font-bold text-gray-900 truncate'>
                {aiData?.topCategory || 'Calculating...'}
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className='space-y-3'>
            <h4 className='text-xs font-bold text-gray-500 uppercase tracking-widest pl-1'>AI Recommendations</h4>
            {displayedInsights.map((insight, index) => {
              const isExpanded = expandedInsight === index
              return (
                <div
                  key={index}
                  onClick={() => setExpandedInsight(isExpanded ? null : index)}
                  className='group p-4 bg-white rounded-xl border border-transparent hover:border-blue-100 transition-all cursor-pointer shadow-sm hover:shadow-md'
                >
                  <div className='flex gap-4'>
                    <div className='mt-1 text-blue-500 group-hover:scale-110 transition-transform'>
                      {insight.includes('⚠️')
? <FaExclamationTriangle className='text-amber-500' /> 
                       : insight.includes('🎯')
? <FaBullseye className='text-purple-500' />
                       : insight.includes('📈')
? <FaArrowUp className='text-emerald-500' />
                       : <FaLightbulb />}
                    </div>
                    <div className='flex-1'>
                      <p className={`text-sm text-gray-700 leading-relaxed transition-all ${!isExpanded && 'line-clamp-2'}`}>
                        {insight}
                      </p>
                      {insight.length > 90 && (
                        <div className='mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-tighter'>
                          {isExpanded ? <><FaChevronUp /> Show Less</> : <><FaChevronDown /> Read Full Insight</>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI Tip Footer */}
          <div className='bg-blue-600 rounded-xl p-4 text-white shadow-blue-200 shadow-lg'>
            <div className='flex items-center gap-2 mb-1'>
              <FaBullseye className='w-3 h-3 text-blue-200' />
              <span className='text-[10px] font-black uppercase tracking-widest text-blue-100'>Daily Tip</span>
            </div>
            <p className='text-xs font-medium leading-relaxed opacity-95'>
              Small daily changes lead to significant wealth. Review your "Subscribed" services today—many users save ₹500+ monthly by canceling unused apps.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInsightsCard
