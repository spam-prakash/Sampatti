import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Pie } from 'react-chartjs-2'
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
  FaWallet,
  FaMoneyBillWave,
  FaChartLine,
  FaBullseye,
  FaChevronRight,
  FaArrowUp,
  FaArrowDown,
  FaExclamationTriangle,
  FaCheckCircle,
  FaLightbulb,
  FaBrain
} from 'react-icons/fa'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
import AIInsightsCard from '../components/dashboard/AIInsightsCard'
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

const DashboardPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [incomes, setIncomes] = useState([])
  const [expenses, setExpenses] = useState([])
  const [goals, setGoals] = useState([])
  const [incomePieData, setIncomePieData] = useState(null)
  const [expensePieData, setExpensePieData] = useState(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [financialHealth, setFinancialHealth] = useState(75)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const INCOME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#0ea5e9', '#3b82f6']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    generateCharts()
  }, [incomes, expenses])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [incomeRes, expenseRes, goalRes, aiRes] = await Promise.all([
        api.get('/income/all'),
        api.get('/expense/all'),
        api.get('/goal/all'),
        api.get('/ai/analysis')
      ])

      if (incomeRes.success) {
        const incomesData = incomeRes.data || []
        setIncomes(incomesData)
        const total = incomesData.reduce((sum, inc) => sum + inc.amount, 0)
        setTotalIncome(total)
      }

      if (expenseRes.success) {
        const expensesData = expenseRes.data || []
        setExpenses(expensesData)
        const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0)
        setTotalExpense(total)
      }

      if (goalRes.success) {
        setGoals(goalRes.data || [])
      }

      if (aiRes) {
        setAiAnalysis(aiRes)
        if (aiRes.summary?.financialHealth?.score) {
          setFinancialHealth(aiRes.summary.financialHealth.score)
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCharts = () => {
    // Income Pie Chart
    const incomeCategoryTotals = {}
    incomes.forEach((inc) => {
      incomeCategoryTotals[inc.category] = (incomeCategoryTotals[inc.category] || 0) + inc.amount
    })

    if (Object.keys(incomeCategoryTotals).length > 0) {
      setIncomePieData({
        labels: Object.keys(incomeCategoryTotals),
        datasets: [
          {
            data: Object.values(incomeCategoryTotals),
            backgroundColor: INCOME_COLORS.slice(0, Object.keys(incomeCategoryTotals).length),
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      })
    }

    // Expense Pie Chart
    const expenseCategoryTotals = {}
    expenses.forEach((exp) => {
      expenseCategoryTotals[exp.category] = (expenseCategoryTotals[exp.category] || 0) + exp.amount
    })

    if (Object.keys(expenseCategoryTotals).length > 0) {
      setExpensePieData({
        labels: Object.keys(expenseCategoryTotals),
        datasets: [
          {
            data: Object.values(expenseCategoryTotals),
            backgroundColor: EXPENSE_COLORS.slice(0, Object.keys(expenseCategoryTotals).length),
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      })
    }
  }

  const getBalance = () => {
    return totalIncome - totalExpense
  }

  const getMonthlyStats = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyIncomes = incomes.filter((inc) => {
      const incDate = new Date(inc.creditedOn)
      return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear
    })

    const monthlyExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date)
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
    })

    return {
      monthlyIncome: monthlyIncomes.reduce((sum, inc) => sum + inc.amount, 0),
      monthlyExpense: monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    }
  }

  const monthlyStats = getMonthlyStats()

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
            {/* Main Balance Card */}
            <div className='card mb-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-100 text-sm font-medium'>Total Balance</p>
                  <h2 className='text-4xl font-bold mt-2'>
                    {formatCurrency(getBalance(), user?.currency)}
                  </h2>
                  <p className='text-blue-100 text-sm mt-2'>
                    {user?.name || 'Welcome'} • Last updated today
                  </p>
                </div>
                <FaWallet className='w-24 h-24 opacity-20' />
              </div>
            </div>

            {/* Key Metrics */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <div className='card hover:shadow-lg transition'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Monthly Income</p>
                    <p className='text-2xl font-bold text-green-600 mt-2'>
                      {formatCurrency(monthlyStats.monthlyIncome, user?.currency)}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>This month</p>
                  </div>
                  <div className='bg-green-100 p-3 rounded-lg'>
                    <FaArrowUp className='w-6 h-6 text-green-600' />
                  </div>
                </div>
              </div>

              <div className='card hover:shadow-lg transition'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Monthly Expense</p>
                    <p className='text-2xl font-bold text-red-600 mt-2'>
                      {formatCurrency(monthlyStats.monthlyExpense, user?.currency)}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>This month</p>
                  </div>
                  <div className='bg-red-100 p-3 rounded-lg'>
                    <FaArrowDown className='w-6 h-6 text-red-600' />
                  </div>
                </div>
              </div>

              <div className='card hover:shadow-lg transition'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Total Income</p>
                    <p className='text-2xl font-bold text-blue-600 mt-2'>
                      {formatCurrency(totalIncome, user?.currency)}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>All time</p>
                  </div>
                  <div className='bg-blue-100 p-3 rounded-lg'>
                    <FaMoneyBillWave className='w-6 h-6 text-blue-600' />
                  </div>
                </div>
              </div>

              <div className='card hover:shadow-lg transition'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Goals Tracking</p>
                    <p className='text-2xl font-bold text-purple-600 mt-2'>
                      {goals.filter((g) => g.isCompleted).length}/{goals.length}
                    </p>
                    <p className='text-xs text-gray-500 mt-1'>Completed</p>
                  </div>
                  <div className='bg-purple-100 p-3 rounded-lg'>
                    <FaBullseye className='w-6 h-6 text-purple-600' />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts and Action Buttons */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
              {/* Income Distribution */}
              <div className='card'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Income Sources</h3>
                  <button
                    onClick={() => navigate('/income')}
                    className='text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium'
                  >
                    Detailed Income
                    <FaChevronRight className='w-4 h-4' />
                  </button>
                </div>
                {incomePieData
                  ? (
                    <div className='relative h-64'>
                      <Pie
                        data={incomePieData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 10,
                                font: { size: 11 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-8'>No income data</p>
                    )}
              </div>

              {/* Expense Distribution */}
              <div className='card'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-gray-900'>Expense Breakdown</h3>
                  <button
                    onClick={() => navigate('/expense')}
                    className='text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium'
                  >
                    Detailed Expense
                    <FaChevronRight className='w-4 h-4' />
                  </button>
                </div>
                {expensePieData
                  ? (
                    <div className='relative h-64'>
                      <Pie
                        data={expensePieData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 10,
                                font: { size: 11 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-8'>No expense data</p>
                    )}
              </div>
            </div>

            {/* AI Insights */}
            <AIInsightsCard insights={null} healthScore={financialHealth} />

            {/* AI Analysis Section */}
            {aiAnalysis && (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
                {/* Financial Health Score */}
                <div className='card bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                      <FaBrain className='text-indigo-600' />
                      Financial Health Score
                    </h3>
                  </div>
                  <div className='flex items-center gap-6'>
                    <div className='relative w-32 h-32'>
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='text-center'>
                          <div className='text-4xl font-bold text-indigo-600'>
                            {aiAnalysis.summary?.financialHealth?.score || 0}
                          </div>
                          <div className='text-xs text-gray-600 font-medium'>
                            {aiAnalysis.summary?.financialHealth?.rating || 'Fair'}
                          </div>
                        </div>
                      </div>
                      <svg className='w-32 h-32 transform -rotate-90'>
                        <circle cx='64' cy='64' r='56' fill='none' stroke='#e0e7ff' strokeWidth='8' />
                        <circle
                          cx='64'
                          cy='64'
                          r='56'
                          fill='none'
                          stroke='#4f46e5'
                          strokeWidth='8'
                          strokeDasharray={`${(aiAnalysis.summary?.financialHealth?.score || 0) * 3.5} 350`}
                          strokeLinecap='round'
                        />
                      </svg>
                    </div>
                    <div className='flex-1 space-y-3'>
                      <div>
                        <p className='text-sm text-gray-600'>Savings Rate</p>
                        <p className='text-lg font-semibold text-gray-900'>
                          {aiAnalysis.summary?.financialHealth?.breakdown?.savingsRate || '0%'}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>Monthly Income</p>
                        <p className='text-lg font-semibold text-green-600'>
                          {formatCurrency(aiAnalysis.summary?.monthlyIncome || 0, user?.currency)}
                        </p>
                      </div>
                      <div>
                        <p className='text-sm text-gray-600'>Monthly Expense</p>
                        <p className='text-lg font-semibold text-red-600'>
                          {formatCurrency(aiAnalysis.summary?.monthlyExpense || 0, user?.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Insights */}
                <div className='card'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                    <FaLightbulb className='text-yellow-500' />
                    Spending Insights
                  </h3>
                  {aiAnalysis.analysis?.spending && (
                    <div className='space-y-4'>
                      {aiAnalysis.analysis.spending.categoryBreakdown?.length > 0 && (
                        <div>
                          <p className='text-sm font-medium text-gray-700 mb-2'>Top Spending Categories</p>
                          {aiAnalysis.analysis.spending.categoryBreakdown.slice(0, 3).map((cat, idx) => (
                            <div key={idx} className='flex items-center justify-between py-2 border-b border-gray-100 last:border-0'>
                              <div>
                                <p className='text-sm font-medium text-gray-900'>{cat.category}</p>
                                <p className='text-xs text-gray-500'>{cat.percentage}% of total</p>
                              </div>
                              <p className='font-semibold text-gray-900'>
                                {formatCurrency(cat.amount, user?.currency)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      {aiAnalysis.analysis.spending.insights?.length > 0 && (
                        <div className='bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-3'>
                          <p className='text-sm text-yellow-800'>
                            {aiAnalysis.analysis.spending.insights[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Alerts & Recommendations */}
                <div className='card'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                    <FaExclamationTriangle className='text-orange-500' />
                    Alerts
                  </h3>
                  {aiAnalysis.alerts?.length > 0
                    ? (
                      <div className='space-y-3'>
                        {aiAnalysis.alerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border flex gap-3 ${
                            alert.type === 'warning'
                              ? 'bg-orange-50 border-orange-200'
                              : 'bg-red-50 border-red-200'
                          }`}
                          >
                            <FaExclamationTriangle
                              className={alert.type === 'warning' ? 'text-orange-600 mt-0.5' : 'text-red-600 mt-0.5'}
                            />
                            <p className={alert.type === 'warning' ? 'text-orange-800 text-sm' : 'text-red-800 text-sm'}>
                              {alert.message}
                            </p>
                          </div>
                        ))}
                      </div>
                      )
                    : (
                      <p className='text-gray-500 text-sm'>No alerts at the moment</p>
                      )}
                </div>

                {/* Recommendations */}
                <div className='card'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                    <FaCheckCircle className='text-green-600' />
                    Immediate Actions
                  </h3>
                  {aiAnalysis.recommendations?.immediate?.length > 0
                    ? (
                      <ul className='space-y-2'>
                        {aiAnalysis.recommendations.immediate.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className='flex items-start gap-2 text-sm'>
                            <span className='text-green-600 font-bold mt-0.5'>•</span>
                            <span className='text-gray-700'>{rec}</span>
                          </li>
                        ))}
                      </ul>
                      )
                    : (
                      <p className='text-gray-500 text-sm'>No recommendations</p>
                      )}
                </div>

                {/* Goals Status */}
                <div className='card lg:col-span-2'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Goals Status</h3>
                  {aiAnalysis.analysis?.goals?.goals?.length > 0
                    ? (
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {aiAnalysis.analysis.goals.goals.map((goal, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-lg border ${
                            goal.status === 'completed'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              {goal.status === 'completed'
                                ? (
                                  <FaCheckCircle className='text-green-600' />
                                  )
                                : (
                                  <FaExclamationTriangle className='text-yellow-600' />
                                  )}
                              <h4 className='font-semibold text-gray-900 flex-1'>{goal.title}</h4>
                            </div>
                            <div className='mb-2'>
                              <div className='flex justify-between text-xs mb-1'>
                                <span className='text-gray-600'>Progress</span>
                                <span className='font-semibold'>{goal.progress}%</span>
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2'>
                                <div
                                  className={`h-2 rounded-full ${
                                  goal.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'
                                }`}
                                  style={{ width: `${goal.progress}%` }}
                                />
                              </div>
                            </div>
                            <p className='text-xs text-gray-600 italic'>{goal.suggestion}</p>
                          </div>
                        ))}
                      </div>
                      )
                    : (
                      <p className='text-gray-500 text-center py-4'>No goals yet</p>
                      )}
                </div>
              </div>
            )}

            {/* Recent Transactions Section */}
            <div className='card'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>Recent Transactions</h3>
              {incomes.length > 0 || expenses.length > 0
                ? (
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead>
                        <tr className='border-b border-gray-200'>
                          <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                            Type
                          </th>
                          <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                            Category
                          </th>
                          <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                            Description
                          </th>
                          <th className='text-right py-3 px-4 text-sm font-semibold text-gray-700'>
                            Amount
                          </th>
                          <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ...incomes.map((inc) => ({
                            ...inc,
                            type: 'income',
                            displayDate: inc.creditedOn
                          })),
                          ...expenses.map((exp) => ({
                            ...exp,
                            type: 'expense',
                            displayDate: exp.date
                          }))
                        ]
                          .sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate))
                          .slice(0, 8)
                          .map((trans) => (
                            <tr
                              key={`${trans.type}-${trans._id}`}
                              className='border-b border-gray-100 hover:bg-gray-50 transition'
                            >
                              <td className='py-3 px-4'>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  trans.type === 'income'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                                >
                                  {trans.type === 'income' ? 'Income' : 'Expense'}
                                </span>
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {trans.category}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {trans.desc || trans.description || '-'}
                              </td>
                              <td
                                className={`py-3 px-4 text-sm font-semibold text-right ${
                                trans.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}
                              >
                                {trans.type === 'income' ? '+' : '-'}
                                {formatCurrency(trans.amount, user?.currency)}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {formatDate(trans.displayDate)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  )
                : (
                  <p className='text-gray-500 text-center py-8'>
                    No transactions yet. Start by adding income or expenses!
                  </p>
                  )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
