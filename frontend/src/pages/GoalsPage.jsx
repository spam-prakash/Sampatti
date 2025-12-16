import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Pie, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import {
  FaPlus,
  FaChartPie,
  FaChartLine,
  FaBullseye,
  FaCheckCircle,
  FaHourglass,
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaSpinner,
  FaRobot,
  FaLightbulb,
  FaPercent,
  FaTag,
  FaStar,
  FaExclamationTriangle,
  FaWallet,
  FaSync
} from 'react-icons/fa'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
import Loader from '../components/common/Loader'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import toast from 'react-hot-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

// Separate Modal Component to prevent parent re-renders
const GoalModal = ({
  showModal,
  setShowModal,
  modalMode,
  editingGoal,
  formData: initialFormData,
  savingsAmount: initialSavingsAmount,
  isSubmitting,
  onSubmit,
  onFormChange,
  onPriorityChange,
  onSavingsChange,
  GOAL_CATEGORIES,
  DIFFICULTY_OPTIONS,
  RISK_OPTIONS,
  STATUS_OPTIONS
}) => {
  const [localFormData, setLocalFormData] = useState(initialFormData)
  const [localSavingsAmount, setLocalSavingsAmount] = useState(initialSavingsAmount || '')

  // Update local state when props change
  useEffect(() => {
    setLocalFormData(initialFormData)
  }, [initialFormData])

  useEffect(() => {
    setLocalSavingsAmount(initialSavingsAmount || '')
  }, [initialSavingsAmount])

  const handleLocalChange = (e) => {
    const { name, value, type, checked } = e.target
    const updatedData = {
      ...localFormData,
      [name]: type === 'checkbox' ? checked : value
    }
    setLocalFormData(updatedData)
    if (onFormChange) onFormChange(updatedData)
  }

  const handleLocalPriorityChange = (level) => {
    const updatedData = {
      ...localFormData,
      priorityLevel: level
    }
    setLocalFormData(updatedData)
    if (onPriorityChange) onPriorityChange(updatedData)
  }

  const handleLocalSavingsChange = (e) => {
    const value = e.target.value
    setLocalSavingsAmount(value)
    if (onSavingsChange) onSavingsChange(value)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(localFormData, localSavingsAmount)
  }

  const getModalTitle = () => {
    switch (modalMode) {
      case 'add': return 'Create New Goal'
      case 'edit': return 'Edit Goal'
      case 'savings': return 'Add Savings'
      case 'complete': return 'Complete Goal'
      default: return 'Goal'
    }
  }

  const getModalDescription = () => {
    switch (modalMode) {
      case 'add': return 'Set up your new financial goal'
      case 'edit': return 'Update your financial goal details'
      case 'savings': return `Add savings to "${editingGoal?.title}"`
      case 'complete': return `Mark "${editingGoal?.title}" as completed`
      default: return ''
    }
  }

  if (!showModal) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        {/* Modal Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h3 className='text-xl font-bold text-gray-900'>
              {getModalTitle()}
            </h3>
            <p className='text-sm text-gray-600 mt-1'>
              {getModalDescription()}
            </p>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            disabled={isSubmitting}
            type='button'
          >
            <FaTimes className='w-5 h-5' />
          </button>
        </div>

        {/* Modal Content */}
        <div className='p-6'>
          {modalMode === 'savings' ? (
            // Savings Modal - Now wrapped in form
            <form onSubmit={handleSubmit}>
              <div className='space-y-6'>
                <div className='text-center'>
                  <FaWallet className='w-16 h-16 text-green-500 mx-auto mb-4' />
                  <h4 className='text-lg font-semibold text-gray-900 mb-2'>
                    Add Savings to Goal
                  </h4>
                  <p className='text-gray-600'>
                    Current progress: {((editingGoal?.currentAmount || 0) / (editingGoal?.targetAmount || 1) * 100).toFixed(1)}%
                  </p>
                  <p className='text-gray-600'>
                    Remaining: ₹{formatCurrency((editingGoal?.targetAmount || 0) - (editingGoal?.currentAmount || 0))}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Amount to Add *
                  </label>
                  <div className='relative'>
                    <span className='absolute left-3 top-3 text-gray-500'>₹</span>
                    <input
                      type='number'
                      value={localSavingsAmount}
                      onChange={handleLocalSavingsChange}
                      className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      placeholder='Enter amount'
                      min='1'
                      step='0.01'
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className='bg-blue-50 p-4 rounded-lg'>
                  <p className='text-sm text-gray-600'>
                    After adding ₹{localSavingsAmount || '0'}, new progress will be:{' '}
                    <span className='font-semibold'>
                      {(((editingGoal?.currentAmount || 0) + parseFloat(localSavingsAmount || 0)) / (editingGoal?.targetAmount || 1) * 100).toFixed(1)}%
                    </span>
                  </p>
                </div>

                {/* Modal Footer for savings */}
                <div className='mt-8 pt-6 border-t border-gray-200 flex gap-3'>
                  <button
                    type='button'
                    onClick={() => setShowModal(false)}
                    className='flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center'
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (
                        <>
                          <FaSpinner className='w-4 h-4 mr-2 animate-spin' />
                          Adding...
                        </>
                        )
                      : (
                        <>
                          <FaWallet className='w-4 h-4 mr-2' />
                          Add Savings
                        </>
                        )}
                  </button>
                </div>
              </div>
            </form>
          ) : modalMode === 'complete' ? (
            // Complete Goal Modal - Now wrapped in form
            <form onSubmit={handleSubmit}>
              <div className='space-y-6'>
                <div className='text-center'>
                  <FaCheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
                  <h4 className='text-lg font-semibold text-gray-900 mb-2'>
                    Complete Goal
                  </h4>
                  <p className='text-gray-600'>
                    Are you sure you want to mark this goal as completed?
                  </p>
                  <div className='mt-4 bg-green-50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-700'>
                      This will set the current amount to the target amount and mark the goal as 100% complete.
                    </p>
                  </div>
                </div>

                {/* Modal Footer for complete */}
                <div className='mt-8 pt-6 border-t border-gray-200 flex gap-3'>
                  <button
                    type='button'
                    onClick={() => setShowModal(false)}
                    className='flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    className='flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center'
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (
                        <>
                          <FaSpinner className='w-4 h-4 mr-2 animate-spin' />
                          Completing...
                        </>
                        )
                      : (
                        <>
                          <FaCheckCircle className='w-4 h-4 mr-2' />
                          Complete Goal
                        </>
                        )}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Add/Edit Goal Modal
            <form onSubmit={handleSubmit}>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Left Column */}
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Goal Title *
                    </label>
                    <input
                      type='text'
                      name='title'
                      value={localFormData.title}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      placeholder='e.g., Emergency Fund, Vacation Savings'
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Description
                    </label>
                    <textarea
                      name='desc'
                      value={localFormData.desc}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      rows='3'
                      placeholder='Describe your goal...'
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Target Amount *
                      </label>
                      <div className='relative'>
                        <span className='absolute left-3 top-3 text-gray-500'>₹</span>
                        <input
                          type='number'
                          name='targetAmount'
                          value={localFormData.targetAmount}
                          onChange={handleLocalChange}
                          className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                          placeholder='0.00'
                          min='1'
                          step='0.01'
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Current Amount
                      </label>
                      <div className='relative'>
                        <span className='absolute left-3 top-3 text-gray-500'>₹</span>
                        <input
                          type='number'
                          name='currentAmount'
                          value={localFormData.currentAmount}
                          onChange={handleLocalChange}
                          className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                          placeholder='0.00'
                          min='0'
                          step='0.01'
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Deadline *
                    </label>
                    <input
                      type='date'
                      name='deadline'
                      value={localFormData.deadline}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Category
                    </label>
                    <select
                      name='category'
                      value={localFormData.category}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      disabled={isSubmitting}
                    >
                      {GOAL_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Difficulty
                      </label>
                      <select
                        name='difficulty'
                        value={localFormData.difficulty}
                        onChange={handleLocalChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                        disabled={isSubmitting}
                      >
                        {DIFFICULTY_OPTIONS.map(diff => (
                          <option key={diff} value={diff}>{diff}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Risk Level
                      </label>
                      <select
                        name='riskLevel'
                        value={localFormData.riskLevel}
                        onChange={handleLocalChange}
                        className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                        disabled={isSubmitting}
                      >
                        {RISK_OPTIONS.map(risk => (
                          <option key={risk} value={risk}>{risk}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Priority Level
                    </label>
                    <div className='flex items-center space-x-4'>
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type='button'
                          onClick={() => handleLocalPriorityChange(level)}
                          className={`flex-1 py-2 text-center rounded-lg border transition-all ${
                            localFormData.priorityLevel === level
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          disabled={isSubmitting}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <div className='flex items-center'>
                      <input
                        type='checkbox'
                        id='autoDeduct'
                        name='autoDeduct'
                        checked={localFormData.autoDeduct}
                        onChange={handleLocalChange}
                        className='w-4 h-4 text-primary-600 rounded focus:ring-primary-500'
                        disabled={isSubmitting}
                      />
                      <label htmlFor='autoDeduct' className='ml-2 text-sm text-gray-700'>
                        Enable Auto-deduct from income
                      </label>
                    </div>

                    {localFormData.autoDeduct && (
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Deduct Percentage
                        </label>
                        <div className='flex items-center space-x-4'>
                          <input
                            type='range'
                            name='deductPercentage'
                            min='0'
                            max='100'
                            value={localFormData.deductPercentage}
                            onChange={handleLocalChange}
                            className='flex-1'
                            disabled={isSubmitting}
                          />
                          <span className='text-sm font-medium text-gray-700 w-12'>
                            {localFormData.deductPercentage}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Status
                    </label>
                    <select
                      name='status'
                      value={localFormData.status}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      disabled={isSubmitting}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Notes
                    </label>
                    <textarea
                      name='notes'
                      value={localFormData.notes}
                      onChange={handleLocalChange}
                      className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors'
                      rows='2'
                      placeholder='Any additional notes or reminders...'
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer for add/edit */}
              <div className='mt-8 pt-6 border-t border-gray-200 flex gap-3'>
                <button
                  type='button'
                  onClick={() => setShowModal(false)}
                  className='flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium'
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center'
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? (
                      <>
                        <FaSpinner className='w-4 h-4 mr-2 animate-spin' />
                        {modalMode === 'add' ? 'Creating...' : 'Updating...'}
                      </>
                      )
                    : (
                      <>
                        <FaSave className='w-4 h-4 mr-2' />
                        {modalMode === 'add' ? 'Create Goal' : 'Update Goal'}
                      </>
                      )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// AI Insights Modal Component (unchanged)
const AIInsightsModal = ({ showAIInsights, setShowAIInsights, aiInsights, loadingAI }) => {
  if (!showAIInsights) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between p-6 border-b'>
          <div>
            <h3 className='text-xl font-bold text-gray-900 flex items-center'>
              <FaRobot className='w-5 h-5 mr-2 text-primary-600' />
              AI Goal Insights
            </h3>
            <p className='text-sm text-gray-600 mt-1'>
              Personalized analysis of your financial goals
            </p>
          </div>
          <button
            onClick={() => setShowAIInsights(false)}
            className='text-gray-400 hover:text-gray-600 transition-colors'
            type='button'
          >
            <FaTimes className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6'>
          {loadingAI
            ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <FaSpinner className='w-8 h-8 text-primary-600 animate-spin mb-4' />
                <p className='text-gray-600'>Analyzing your goals...</p>
              </div>
              )
            : aiInsights
              ? (
                <div className='space-y-6'>
                  {aiInsights.message === 'AI analysis not available'
                    ? (
                      <div className='text-center py-8'>
                        <FaLightbulb className='w-12 h-12 text-yellow-400 mx-auto mb-4' />
                        <h4 className='text-lg font-semibold text-gray-900 mb-2'>AI Service Unavailable</h4>
                        <p className='text-gray-600'>
                          The AI analysis service is currently not available. Please check your configuration.
                        </p>
                      </div>
                      )
                    : (
                      <>
                        {aiInsights.insights && aiInsights.insights.length > 0 && (
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Key Insights</h4>
                            <div className='space-y-3'>
                              {aiInsights.insights.map((insight, index) => (
                                <div key={index} className='flex items-start p-3 bg-blue-50 rounded-lg'>
                                  <FaLightbulb className='w-5 h-5 text-blue-600 mr-3 mt-0.5' />
                                  <span className='text-gray-700'>{insight}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiInsights.suggestions && aiInsights.suggestions.length > 0 && (
                          <div>
                            <h4 className='text-lg font-semibold text-gray-900 mb-4'>Suggestions</h4>
                            <div className='space-y-3'>
                              {aiInsights.suggestions.map((suggestion, index) => (
                                <div key={index} className='flex items-start p-3 bg-green-50 rounded-lg'>
                                  <FaExclamationTriangle className='w-5 h-5 text-green-600 mr-3 mt-0.5' />
                                  <span className='text-gray-700'>{suggestion}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiInsights.timestamp && (
                          <div className='pt-4 border-t border-gray-200'>
                            <p className='text-sm text-gray-500'>
                              Analysis generated: {new Date(aiInsights.timestamp).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </>
                      )}
                </div>
                )
              : (
                <div className='text-center py-12'>
                  <p className='text-gray-600'>No AI insights available</p>
                </div>
                )}
        </div>
      </div>
    </div>
  )
}

// Main GoalsPage Component
const GoalsPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState([])
  const [categoryData, setCategoryData] = useState(null)
  const [progressData, setProgressData] = useState(null)
  const [timelineData, setTimelineData] = useState(null)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalMode, setModalMode] = useState('add')

  // AI Insights states
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [aiInsights, setAiInsights] = useState(null)
  const [loadingAI, setLoadingAI] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    desc: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    category: 'Emergency Fund',
    priorityLevel: 3,
    difficulty: 'Medium',
    riskLevel: 'Medium',
    status: 'Not Started',
    notes: '',
    autoDeduct: false,
    deductPercentage: 10,
    tags: []
  })

  // Savings amount state
  const [savingsAmount, setSavingsAmount] = useState('')

  const GOAL_CATEGORIES = [
    'Emergency Fund',
    'Car',
    'House',
    'Travel',
    'Education',
    'Retirement',
    'Wedding',
    'Business',
    'Gadgets',
    'Health',
    'Other'
  ]

  const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard', 'Very Hard']
  const RISK_OPTIONS = ['Low', 'Medium', 'High']
  const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Almost There', 'Completed', 'Behind Schedule']

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#14b8a6']

  useEffect(() => {
    fetchGoalsData()
  }, [])

  useEffect(() => {
    generateCharts()
  }, [goals])

  const fetchGoalsData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/goal/all')
      if (response.success) {
        setGoals(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      toast.error('Failed to fetch goals data')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAIInsights = async () => {
    try {
      setLoadingAI(true)
      const response = await api.get('/goal/ai-insights')
      if (response.success) {
        setAiInsights(response.data)
        setShowAIInsights(true)
      } else {
        toast.error(response.message || 'AI service not available')
      }
    } catch (error) {
      console.error('AI Insights error:', error)
      toast.error('Failed to fetch AI insights')
    } finally {
      setLoadingAI(false)
    }
  }

  const generateCharts = () => {
    if (goals.length === 0) return

    // Category Distribution
    const categoryTotals = {}
    goals.forEach((goal) => {
      categoryTotals[goal.category] = (categoryTotals[goal.category] || 0) + 1
    })

    const pieData = {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: COLORS.slice(0, Object.keys(categoryTotals).length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }

    setCategoryData(pieData)

    // Progress Distribution
    const progressRanges = {
      'Not Started (0%)': 0,
      'In Progress (1-50%)': 0,
      'Almost There (51-99%)': 0,
      'Completed (100%)': 0
    }

    goals.forEach((goal) => {
      const progress = goal.progress || 0
      if (progress === 0) progressRanges['Not Started (0%)']++
      else if (progress < 50) progressRanges['In Progress (1-50%)']++
      else if (progress < 100) progressRanges['Almost There (51-99%)']++
      else progressRanges['Completed (100%)']++
    })

    const progressChartData = {
      labels: Object.keys(progressRanges),
      datasets: [
        {
          data: Object.values(progressRanges),
          backgroundColor: ['#f59e0b', '#3b82f6', '#06b6d4', '#10b981'],
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    }

    setProgressData(progressChartData)

    // Timeline
    const sortedGoals = [...goals].sort(
      (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    )

    const monthlyTotals = {}
    sortedGoals.forEach((goal) => {
      const date = new Date(goal.createdAt || new Date())
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + 1
    })

    const timelineData = {
      labels: Object.keys(monthlyTotals),
      datasets: [{
        label: 'Goals Created',
        data: Object.values(monthlyTotals),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5
      }]
    }

    setTimelineData(timelineData)
  }

  // Open modal for adding goal
  const handleAddGoal = () => {
    setEditingGoal(null)
    setModalMode('add')
    setFormData({
      title: '',
      desc: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      category: 'Emergency Fund',
      priorityLevel: 3,
      difficulty: 'Medium',
      riskLevel: 'Medium',
      status: 'Not Started',
      notes: '',
      autoDeduct: false,
      deductPercentage: 10,
      tags: []
    })
    setShowModal(true)
  }

  // Open modal for editing goal
  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    setModalMode('edit')
    setFormData({
      title: goal.title || '',
      desc: goal.desc || '',
      targetAmount: goal.targetAmount || '',
      currentAmount: goal.currentAmount || '',
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      category: goal.category || 'Emergency Fund',
      priorityLevel: goal.priorityLevel || 3,
      difficulty: goal.difficulty || 'Medium',
      riskLevel: goal.riskLevel || 'Medium',
      status: goal.status || 'Not Started',
      notes: goal.notes || '',
      autoDeduct: goal.autoDeduct || false,
      deductPercentage: goal.deductPercentage || 10,
      tags: goal.tags || []
    })
    setShowModal(true)
  }

  // Open modal for adding savings
  const handleAddSavingsModal = (goal) => {
    setEditingGoal(goal)
    setModalMode('savings')
    setSavingsAmount('')
    setShowModal(true)
  }

  // Open modal for completing goal
  const handleCompleteGoalModal = (goal) => {
    setEditingGoal(goal)
    setModalMode('complete')
    setShowModal(true)
  }

  // Handle form submission (add or update)
  const handleFormSubmit = async (formData, savingsAmount) => {
    if (modalMode === 'savings') {
      if (!savingsAmount || parseFloat(savingsAmount) <= 0) {
        toast.error('Please enter a valid savings amount')
        return
      }

      try {
        setIsSubmitting(true)
        const response = await api.put(`/goal/add-savings/${editingGoal._id}`, {
          amount: parseFloat(savingsAmount)
        })

        if (response.success) {
          toast.success('Savings added successfully!')
          setShowModal(false)
          fetchGoalsData()
        } else {
          toast.error(response.message || 'Failed to add savings')
        }
      } catch (error) {
        console.error('Error adding savings:', error)
        toast.error(error.response?.data?.error || 'Failed to add savings')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (modalMode === 'complete') {
      try {
        setIsSubmitting(true)
        const response = await api.put(`/goal/complete/${editingGoal._id}`)

        if (response.success) {
          toast.success('Goal marked as completed!')
          setShowModal(false)
          fetchGoalsData()
        } else {
          toast.error(response.message || 'Failed to complete goal')
        }
      } catch (error) {
        console.error('Error completing goal:', error)
        toast.error(error.response?.data?.error || 'Failed to complete goal')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // For add/edit modes
    if (!formData.title || !formData.targetAmount || !formData.deadline) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data for API
      const goalData = {
        title: formData.title,
        desc: formData.desc,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount) || 0,
        deadline: formData.deadline,
        category: formData.category,
        priorityLevel: parseInt(formData.priorityLevel),
        difficulty: formData.difficulty,
        riskLevel: formData.riskLevel,
        status: formData.status,
        notes: formData.notes,
        autoDeduct: formData.autoDeduct,
        deductPercentage: parseFloat(formData.deductPercentage),
        tags: formData.tags
      }

      let response
      if (modalMode === 'edit') {
        response = await api.put(`/goal/update/${editingGoal._id}`, goalData)
      } else {
        response = await api.post('/goal/add', goalData)
      }

      if (response.success) {
        toast.success(modalMode === 'edit' ? 'Goal updated successfully!' : 'Goal created successfully!')
        setShowModal(false)
        fetchGoalsData()
      } else {
        toast.error(response.message || 'Failed to save goal')
      }
    } catch (error) {
      console.error('Error saving goal:', error)
      toast.error(error.response?.data?.error || 'Failed to save goal')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form updates from modal
  const handleFormChange = (updatedFormData) => {
    setFormData(updatedFormData)
  }

  const handlePriorityChange = (updatedFormData) => {
    setFormData(updatedFormData)
  }

  const handleSavingsChange = (amount) => {
    setSavingsAmount(amount)
  }

  // Handle delete goal
  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return
    }

    try {
      const response = await api.delete(`/goal/delete/${goalId}`)
      if (response.success) {
        toast.success('Goal deleted successfully!')
        fetchGoalsData()
      }
    } catch (error) {
      toast.error('Failed to delete goal')
    }
  }

  const getGoalStatus = (goal) => {
    const now = new Date()
    const deadline = new Date(goal.deadline)
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))

    if (goal.isCompleted) return { text: 'Completed', color: 'text-green-600', bgColor: 'bg-green-50' }
    if (daysLeft < 0) return { text: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50' }
    if (daysLeft < 30) return { text: 'Urgent', color: 'text-orange-600', bgColor: 'bg-orange-50' }
    return { text: 'On Track', color: 'text-blue-600', bgColor: 'bg-blue-50' }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Sidebar />
      <div className='md:pl-64 flex flex-col'>
        <Header />
        <main className='flex-1 p-6'>
          <div className='max-w-7xl mx-auto'>
            {/* Header with AI Button */}
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Financial Goals</h1>
                <p className='text-gray-600 mt-1'>Set and track your financial milestones</p>
              </div>
              <div className='flex gap-3'>
                <button
                  onClick={fetchAIInsights}
                  className='btn-secondary flex items-center gap-2'
                  disabled={loadingAI}
                  type='button'
                >
                  {loadingAI
                    ? (
                      <FaSpinner className='w-4 h-4 animate-spin' />
                      )
                    : (
                      <FaRobot className='w-4 h-4' />
                      )}
                  AI Insights
                </button>
                <button
                  onClick={handleAddGoal}
                  className='btn-primary flex items-center gap-2'
                  type='button'
                >
                  <FaPlus />
                  Create Goal
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Total Goals</p>
                    <p className='text-2xl font-bold text-blue-600 mt-1'>{goals.length}</p>
                  </div>
                  <FaBullseye className='w-10 h-10 text-blue-400' />
                </div>
              </div>

              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Completed</p>
                    <p className='text-2xl font-bold text-green-600 mt-1'>
                      {goals.filter((g) => g.isCompleted).length}
                    </p>
                  </div>
                  <FaCheckCircle className='w-10 h-10 text-green-400' />
                </div>
              </div>

              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>In Progress</p>
                    <p className='text-2xl font-bold text-orange-600 mt-1'>
                      {goals.filter((g) => !g.isCompleted && (g.progress || 0) < 100).length}
                    </p>
                  </div>
                  <FaHourglass className='w-10 h-10 text-orange-400' />
                </div>
              </div>

              <div className='card'>
                <div>
                  <p className='text-gray-600 text-sm'>Total Target</p>
                  <p className='text-2xl font-bold text-purple-600 mt-1'>
                    {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0))}
                  </p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
              {/* Goals by Category */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaChartPie />
                  Goals by Category
                </h3>
                {categoryData && categoryData.labels.length > 0
                  ? (
                    <div className='relative h-80'>
                      <Pie
                        data={categoryData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: { size: 12 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-10'>No goals created yet</p>
                    )}
              </div>

              {/* Progress Distribution */}
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaChartLine />
                  Progress Distribution
                </h3>
                {progressData && progressData.labels.length > 0
                  ? (
                    <div className='relative h-80'>
                      <Pie
                        data={progressData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: { size: 12 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-10'>No goals created yet</p>
                    )}
              </div>
            </div>

            {/* Timeline Chart */}
            <div className='card mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FaChartLine />
                Goals Timeline
              </h3>
              {timelineData && timelineData.labels.length > 0
                ? (
                  <div className='relative h-80'>
                    <Line
                      data={timelineData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: true,
                            labels: {
                              font: { size: 12 }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true
                          }
                        }
                      }}
                    />
                  </div>
                  )
                : (
                  <p className='text-gray-500 text-center py-10'>No goals timeline data</p>
                  )}
            </div>

            {/* Goals List */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold text-gray-900'>Your Goals</h3>
              {goals.length > 0
                ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {goals.map((goal) => {
                      const status = getGoalStatus(goal)
                      const progress = goal.progress || ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100
                      const daysLeft = Math.ceil(
                        (new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <div key={goal._id} className='card hover:shadow-lg transition group'>
                          <div className='flex items-start justify-between mb-3'>
                            <div className='flex-1'>
                              <h4 className='font-semibold text-gray-900'>{goal.title}</h4>
                              <div className='flex items-center gap-2 mt-1'>
                                <span className='text-sm text-gray-600'>{goal.category}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bgColor} ${status.color}`}>
                                  {status.text}
                                </span>
                              </div>
                            </div>
                            <div className='opacity-0 group-hover:opacity-100 transition-opacity flex gap-1'>
                              <button
                                onClick={() => handleEditGoal(goal)}
                                className='p-1 text-gray-600 hover:text-primary-600'
                                title='Edit'
                                type='button'
                              >
                                <FaEdit className='w-4 h-4' />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal._id)}
                                className='p-1 text-gray-600 hover:text-red-600'
                                title='Delete'
                                type='button'
                              >
                                <FaTrash className='w-4 h-4' />
                              </button>
                            </div>
                          </div>

                          <div className='space-y-3'>
                            <div>
                              <div className='flex justify-between text-sm mb-1'>
                                <span className='text-gray-600'>Progress</span>
                                <span className='font-medium'>{progress.toFixed(1)}%</span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className={`h-2 rounded-full transition-all ${
                                  progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>

                            <div className='grid grid-cols-2 gap-2 text-sm'>
                              <div className='bg-gray-50 p-2 rounded'>
                                <p className='text-gray-600'>Current</p>
                                <p className='font-semibold text-gray-900'>
                                  {formatCurrency(goal.currentAmount)}
                                </p>
                              </div>
                              <div className='bg-gray-50 p-2 rounded'>
                                <p className='text-gray-600'>Target</p>
                                <p className='font-semibold text-gray-900'>
                                  {formatCurrency(goal.targetAmount)}
                                </p>
                              </div>
                            </div>

                            <div className='flex items-center gap-1 text-sm text-gray-600'>
                              <FaCalendarAlt className='w-3 h-3' />
                              {daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}
                            </div>

                            <div className='flex gap-2 pt-2'>
                              {!goal.isCompleted && progress < 100 && (
                                <button
                                  onClick={() => handleAddSavingsModal(goal)}
                                  className='flex-1 text-sm py-2 px-3 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition font-medium flex items-center justify-center gap-1'
                                  type='button'
                                >
                                  <FaWallet className='w-3 h-3' />
                                  Add Savings
                                </button>
                              )}
                              {!goal.isCompleted && (
                                <button
                                  onClick={() => handleCompleteGoalModal(goal)}
                                  className='flex-1 text-sm py-2 px-3 bg-green-50 text-green-600 rounded hover:bg-green-100 transition font-medium flex items-center justify-center gap-1'
                                  type='button'
                                >
                                  <FaCheckCircle className='w-3 h-3' />
                                  Complete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )
                : (
                  <div className='card text-center py-12'>
                    <FaBullseye className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-600 mb-4'>No goals created yet.</p>
                    <button
                      onClick={handleAddGoal}
                      className='btn-primary inline-flex items-center gap-2'
                      type='button'
                    >
                      <FaPlus />
                      Create Your First Goal
                    </button>
                  </div>
                  )}
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <GoalModal
        showModal={showModal}
        setShowModal={setShowModal}
        modalMode={modalMode}
        editingGoal={editingGoal}
        formData={formData}
        savingsAmount={savingsAmount}
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        onFormChange={handleFormChange}
        onPriorityChange={handlePriorityChange}
        onSavingsChange={handleSavingsChange}
        GOAL_CATEGORIES={GOAL_CATEGORIES}
        DIFFICULTY_OPTIONS={DIFFICULTY_OPTIONS}
        RISK_OPTIONS={RISK_OPTIONS}
        STATUS_OPTIONS={STATUS_OPTIONS}
      />

      <AIInsightsModal
        showAIInsights={showAIInsights}
        setShowAIInsights={setShowAIInsights}
        aiInsights={aiInsights}
        loadingAI={loadingAI}
      />
    </div>
  )
}

export default GoalsPage
