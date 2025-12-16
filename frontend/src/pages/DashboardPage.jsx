import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  FaBrain,
  FaCalendarAlt,
  FaTag,
  FaSortAmountDown,
  FaEdit,
  FaTrash
} from 'react-icons/fa'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
import AIInsightsCard from '../components/dashboard/AIInsightsCard'
import Loader from '../components/common/Loader'
import api from '../services/api'
import { formatCurrency, formatDate, formatDateToYYYYMMDD } from '../utils/helpers'
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
  const [balanceData, setBalanceData] = useState(null)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [financialHealth, setFinancialHealth] = useState(75)
  const [aiAnalysis, setAiAnalysis] = useState(null)

  const [transactionsSortBy, setTransactionsSortBy] = useState('date')
  const [transactionsSortOrder, setTransactionsSortOrder] = useState('desc')
  const [transactionsPagination, setTransactionsPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10
  })

  const INCOME_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const EXPENSE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#0ea5e9', '#3b82f6']

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (incomes.length > 0 || expenses.length > 0) {
      generateCharts()
      updateTransactionsPagination()
    }
  }, [incomes, expenses, transactionsSortBy, transactionsSortOrder])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [incomeRes, expenseRes, goalRes, aiRes] = await Promise.all([
        api.get('/income/all', { params: { limit: 1000 } }),
        api.get('/expense/all', { params: { limit: 1000 } }),
        api.get('/goal/all'),
        api.get('/ai/analysis').catch(() => ({ success: false }))
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

      if (aiRes?.success) {
        setAiAnalysis(aiRes.data || aiRes)
        if (aiRes.data?.summary?.financialHealth?.score) {
          setFinancialHealth(aiRes.data.summary.financialHealth.score)
        } else if (aiRes.summary?.financialHealth?.score) {
          setFinancialHealth(aiRes.summary.financialHealth.score)
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const generateCharts = () => {
    const incomeCategoryTotals = {}
    incomes.forEach((inc) => {
      if (inc.category) {
        incomeCategoryTotals[inc.category] = (incomeCategoryTotals[inc.category] || 0) + inc.amount
      }
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
    } else {
      setIncomePieData(null)
    }

    const expenseCategoryTotals = {}
    expenses.forEach((exp) => {
      if (exp.category) {
        expenseCategoryTotals[exp.category] = (expenseCategoryTotals[exp.category] || 0) + exp.amount
      }
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
    } else {
      setExpensePieData(null)
    }

    try {
      const allTransactions = [
        ...incomes.map(inc => ({
          type: 'income',
          date: new Date(inc.creditedOn || inc.date),
          amount: inc.amount,
          originalDate: inc.creditedOn || inc.date
        })),
        ...expenses.map(exp => ({
          type: 'expense',
          date: new Date(exp.date || exp.creditedOn),
          amount: -exp.amount,
          originalDate: exp.date || exp.creditedOn
        }))
      ].sort((a, b) => a.date - b.date)

      if (allTransactions.length === 0) {
        setBalanceData(null)
        return
      }

      const now = new Date()
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      thirtyDaysAgo.setHours(0, 0, 0, 0)
      const startOfToday = new Date(now)
      startOfToday.setHours(0, 0, 0, 0)

      const recentTransactions = allTransactions.filter(t => {
        t.date.setHours(0, 0, 0, 0)
        return t.date >= thirtyDaysAgo && t.date <= startOfToday
      })

      const groupedByDate = {}
      recentTransactions.forEach(trans => {
        const isoKey = formatDateToYYYYMMDD(trans.date)
        groupedByDate[isoKey] = (groupedByDate[isoKey] || 0) + trans.amount
      })

      const labels = []
      const cumulativeValues = []
      let runningBalance = 0

      const currentDate = new Date(thirtyDaysAgo)
      while (currentDate <= startOfToday) {
        const iso = formatDateToYYYYMMDD(new Date(currentDate))
        const month = currentDate.toLocaleDateString('en-US', { month: 'short' })
        const day = currentDate.getDate()
        labels.push(`${month} ${day}`)

        runningBalance += groupedByDate[iso] || 0
        cumulativeValues.push(runningBalance)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      setBalanceData({
        labels,
        datasets: [{
          label: 'Balance (Cumulative)',
          data: cumulativeValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          cubicInterpolationMode: 'monotone',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      })
    } catch (err) {
      console.error('Balance chart error:', err)
      setBalanceData(null)
    }
  }

  const updateTransactionsPagination = () => {
    const allTransactions = [
      ...incomes,
      ...expenses
    ]

    const totalCount = allTransactions.length
    const totalPages = Math.ceil(totalCount / transactionsPagination.pageSize)

    setTransactionsPagination(prev => ({
      ...prev,
      totalPages,
      totalCount
    }))
  }

  const getPaginatedTransactions = () => {
    const allTransactions = [
      ...incomes.map(inc => ({
        ...inc,
        type: 'income',
        displayDate: inc.creditedOn || inc.date,
        description: inc.desc || inc.description || '-',
        category: inc.category || 'Uncategorized',
        _id: inc._id
      })),
      ...expenses.map(exp => ({
        ...exp,
        type: 'expense',
        displayDate: exp.date || exp.creditedOn,
        description: exp.description || exp.desc || '-',
        category: exp.category || 'Uncategorized',
        _id: exp._id
      }))
    ]

    const sorted = allTransactions.sort((a, b) => {
      let aValue, bValue

      switch (transactionsSortBy) {
        case 'amount':
          aValue = a.amount
          bValue = b.amount
          break
        case 'category':
          aValue = a.category
          bValue = b.category
          break
        case 'date':
        default:
          aValue = new Date(a.displayDate)
          bValue = new Date(b.displayDate)
      }

      if (aValue < bValue) return transactionsSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return transactionsSortOrder === 'asc' ? 1 : -1
      return 0
    })

    const startIndex = (transactionsPagination.page - 1) * transactionsPagination.pageSize
    const endIndex = startIndex + transactionsPagination.pageSize

    return sorted.slice(startIndex, endIndex)
  }

  const handleTransactionsSort = (field) => {
    if (transactionsSortBy === field) {
      setTransactionsSortOrder(transactionsSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setTransactionsSortBy(field)
      setTransactionsSortOrder('desc')
    }
  }

  const handleTransactionsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= transactionsPagination.totalPages) {
      setTransactionsPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleDeleteTransaction = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return
    }

    try {
      const endpoint = type === 'income' ? `/income/delete/${id}` : `/expense/delete/${id}`
      const response = await api.delete(endpoint)

      if (response.success) {
        toast.success('Transaction deleted successfully!')
        fetchDashboardData()
      }
    } catch (error) {
      toast.error('Failed to delete transaction')
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
      try {
        const incDate = new Date(inc.creditedOn || inc.date)
        return incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear
      } catch (e) {
        return false
      }
    })

    const monthlyExpenses = expenses.filter((exp) => {
      try {
        const expDate = new Date(exp.date || exp.creditedOn)
        return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear
      } catch (e) {
        return false
      }
    })

    return {
      monthlyIncome: monthlyIncomes.reduce((sum, inc) => sum + inc.amount, 0),
      monthlyExpense: monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0)
    }
  }

  const monthlyStats = getMonthlyStats()
  const paginatedTransactions = getPaginatedTransactions()

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

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
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

            {/* Balance Timeline */}
            <div className='card mb-8'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Balance Timeline</h3>
                <button
                  onClick={() => {
                    fetchDashboardData()
                    toast.success('Dashboard refreshed')
                  }}
                  className='text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium'
                >
                  Refresh
                </button>
              </div>
              {balanceData && balanceData.labels && balanceData.labels.length > 0
                ? (
                  <div className='relative h-80'>
                    <Line
                      data={balanceData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: true } },
                        scales: { y: { beginAtZero: false, ticks: { callback: (val) => formatCurrency(val, user?.currency) } } }
                      }}
                    />
                  </div>
                  )
                : (
                  <p className='text-gray-500 text-center py-8'>No balance data</p>
                  )}
            </div>

            {/* AI Insights */}
            <AIInsightsCard insights={null} healthScore={financialHealth} />

            {/* Recent Transactions Section */}
            <div className='card'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Recent Transactions</h3>
                <div className='text-sm text-gray-600'>
                  Showing {paginatedTransactions.length} of {transactionsPagination.totalCount} transactions
                </div>
              </div>

              {paginatedTransactions.length > 0
                ? (
                  <>
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-gray-200'>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleTransactionsSort('date')}
                                className='flex items-center gap-1 hover:text-blue-600'
                              >
                                <FaCalendarAlt className='w-4 h-4' />
                                Date
                                {transactionsSortBy === 'date' && (
                                  <span>{transactionsSortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleTransactionsSort('category')}
                                className='flex items-center gap-1 hover:text-blue-600'
                              >
                                <FaTag className='w-4 h-4' />
                                Category
                                {transactionsSortBy === 'category' && (
                                  <span>{transactionsSortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Description
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Type
                            </th>
                            <th className='text-right py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleTransactionsSort('amount')}
                                className='flex items-center gap-1 hover:text-blue-600 justify-end'
                              >
                                <FaSortAmountDown className='w-4 h-4' />
                                Amount
                                {transactionsSortBy === 'amount' && (
                                  <span>{transactionsSortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-right py-3 px-4 text-sm font-semibold text-gray-700'>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTransactions.map((trans) => (
                            <tr
                              key={`${trans.type}-${trans._id}`}
                              className='border-b border-gray-100 hover:bg-gray-50 transition'
                            >
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {formatDate(trans.displayDate)}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {trans.category}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {trans.description}
                              </td>
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
                              <td
                                className={`py-3 px-4 text-sm font-semibold text-right ${
                                trans.type === 'income' ? 'text-green-600' : 'text-red-600'
                              }`}
                              >
                                {trans.type === 'income' ? '+' : '-'}
                                {formatCurrency(trans.amount, user?.currency)}
                              </td>
                              <td className='py-3 px-4 text-sm text-right space-x-2'>
                                <div className='flex justify-end gap-2'>
                                  <button
                                    onClick={() => navigate(trans.type === 'income' ? '/income' : '/expense')}
                                    className='text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1'
                                  >
                                    <FaEdit className='w-3 h-3' /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(trans.type, trans._id)}
                                    className='text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1'
                                  >
                                    <FaTrash className='w-3 h-3' /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {transactionsPagination.totalPages > 1 && (
                      <div className='flex justify-between items-center mt-6 pt-6 border-t border-gray-200'>
                        <div className='text-sm text-gray-600'>
                          Page {transactionsPagination.page} of {transactionsPagination.totalPages}
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => handleTransactionsPageChange(transactionsPagination.page - 1)}
                            disabled={transactionsPagination.page <= 1}
                            className={`px-3 py-1 rounded text-sm ${
                              transactionsPagination.page <= 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handleTransactionsPageChange(transactionsPagination.page + 1)}
                            disabled={transactionsPagination.page >= transactionsPagination.totalPages}
                            className={`px-3 py-1 rounded text-sm ${
                              transactionsPagination.page >= transactionsPagination.totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                  )
                : (
                  <div className='text-center py-10'>
                    <FaMoneyBillWave className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500 text-lg'>No transactions found</p>
                    <p className='text-gray-400 text-sm mt-2'>Start by adding income or expense records</p>
                    <div className='flex gap-4 justify-center mt-4'>
                      <button
                        onClick={() => navigate('/income')}
                        className='btn-primary'
                      >
                        Add Income
                      </button>
                      <button
                        onClick={() => navigate('/expense')}
                        className='btn-secondary'
                      >
                        Add Expense
                      </button>
                    </div>
                  </div>
                  )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
