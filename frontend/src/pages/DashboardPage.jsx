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
  FaBullseye,
  FaChevronRight,
  FaArrowUp,
  FaArrowDown,
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
import SampattiBot from '../components/dashboard/SampattiBot'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)
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
        setTotalIncome(incomesData.reduce((sum, inc) => sum + inc.amount, 0))
      }

      if (expenseRes.success) {
        const expensesData = expenseRes.data || []
        setExpenses(expensesData)
        setTotalExpense(expensesData.reduce((sum, exp) => sum + exp.amount, 0))
      }

      if (goalRes.success) setGoals(goalRes.data || [])

      if (aiRes?.success) {
        setAiAnalysis(aiRes.data || aiRes)
        const score = aiRes.data?.summary?.financialHealth?.score || aiRes.summary?.financialHealth?.score
        if (score) setFinancialHealth(score)
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
      if (inc.category) incomeCategoryTotals[inc.category] = (incomeCategoryTotals[inc.category] || 0) + inc.amount
    })

    setIncomePieData(Object.keys(incomeCategoryTotals).length > 0
      ? {
          labels: Object.keys(incomeCategoryTotals),
          datasets: [{
            data: Object.values(incomeCategoryTotals),
            backgroundColor: INCOME_COLORS.slice(0, Object.keys(incomeCategoryTotals).length),
            borderColor: '#fff',
            borderWidth: 2
          }]
        }
      : null)

    const expenseCategoryTotals = {}
    expenses.forEach((exp) => {
      if (exp.category) expenseCategoryTotals[exp.category] = (expenseCategoryTotals[exp.category] || 0) + exp.amount
    })

    setExpensePieData(Object.keys(expenseCategoryTotals).length > 0
      ? {
          labels: Object.keys(expenseCategoryTotals),
          datasets: [{
            data: Object.values(expenseCategoryTotals),
            backgroundColor: EXPENSE_COLORS.slice(0, Object.keys(expenseCategoryTotals).length),
            borderColor: '#fff',
            borderWidth: 2
          }]
        }
      : null)

    try {
      const allTransactions = [
        ...incomes.map(inc => ({ type: 'income', date: new Date(inc.creditedOn || inc.date), amount: inc.amount })),
        ...expenses.map(exp => ({ type: 'expense', date: new Date(exp.date || exp.creditedOn), amount: -exp.amount }))
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
        const d = new Date(t.date)
        d.setHours(0, 0, 0, 0)
        return d >= thirtyDaysAgo && d <= startOfToday
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
        labels.push(`${currentDate.toLocaleDateString('en-US', { month: 'short' })} ${currentDate.getDate()}`)
        runningBalance += groupedByDate[iso] || 0
        cumulativeValues.push(runningBalance)
        currentDate.setDate(currentDate.getDate() + 1)
      }

      setBalanceData({
        labels,
        datasets: [{
          label: 'Balance',
          data: cumulativeValues,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      })
    } catch (err) {
      setBalanceData(null)
    }
  }

  const updateTransactionsPagination = () => {
    const totalCount = incomes.length + expenses.length
    setTransactionsPagination(prev => ({
      ...prev,
      totalPages: Math.ceil(totalCount / prev.pageSize),
      totalCount
    }))
  }

  const getPaginatedTransactions = () => {
    const all = [
      ...incomes.map(inc => ({ ...inc, type: 'income', displayDate: inc.creditedOn || inc.date, description: inc.desc || inc.description || '-', category: inc.category || 'Uncategorized' })),
      ...expenses.map(exp => ({ ...exp, type: 'expense', displayDate: exp.date || exp.creditedOn, description: exp.description || exp.desc || '-', category: exp.category || 'Uncategorized' }))
    ]

    const sorted = all.sort((a, b) => {
      let aV, bV
      if (transactionsSortBy === 'amount') { aV = a.amount; bV = b.amount } else if (transactionsSortBy === 'category') { aV = a.category; bV = b.category } else { aV = new Date(a.displayDate); bV = new Date(b.displayDate) }
      return transactionsSortOrder === 'asc' ? (aV > bV ? 1 : -1) : (aV < bV ? 1 : -1)
    })

    const start = (transactionsPagination.page - 1) * transactionsPagination.pageSize
    return sorted.slice(start, start + transactionsPagination.pageSize)
  }

  const handleTransactionsSort = (field) => {
    if (transactionsSortBy === field) setTransactionsSortOrder(transactionsSortOrder === 'asc' ? 'desc' : 'asc')
    else { setTransactionsSortBy(field); setTransactionsSortOrder('desc') }
  }

  const handleTransactionsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= transactionsPagination.totalPages) {
      setTransactionsPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const handleDeleteTransaction = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return
    try {
      const endpoint = type === 'income' ? `/income/delete/${id}` : `/expense/delete/${id}`
      const response = await api.delete(endpoint)
      if (response.success) {
        toast.success('Deleted successfully')
        fetchDashboardData()
      }
    } catch (error) { toast.error('Failed to delete') }
  }

  const getMonthlyStats = () => {
    const now = new Date()
    const m = now.getMonth(); const y = now.getFullYear()
    const filterFn = (d) => {
      const date = new Date(d.creditedOn || d.date)
      return date.getMonth() === m && date.getFullYear() === y
    }
    return {
      monthlyIncome: incomes.filter(filterFn).reduce((s, i) => s + i.amount, 0),
      monthlyExpense: expenses.filter(filterFn).reduce((s, i) => s + i.amount, 0)
    }
  }

  const monthlyStats = getMonthlyStats()
  const paginatedTransactions = getPaginatedTransactions()

  return (
    <div className='flex h-screen bg-gray-50 overflow-hidden'>
      {/* Sidebar - Positioned correctly within flex */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col min-w-0 relative overflow-y-auto'>
        {/* Mobile Header logic handled via Header component */}
        <Header onMenuClick={toggleSidebar} />

        <main className='flex-1 p-4 md:p-8'>
          {loading && <div className='min-h-screen flex items-center justify-center bg-white'><Loader size='lg' /></div>}
          <div className='max-w-7xl mx-auto space-y-8'>

            {/* Main Balance Card */}
            <div className='bg-blue-600 rounded-3xl text-white p-8 md:p-10 shadow-lg relative overflow-hidden'>
              <div className='relative z-10'>
                <p className='text-blue-100 text-sm font-medium'>Total Balance</p>
                <h2 className='text-4xl md:text-5xl font-bold mt-3 tracking-tight'>
                  {formatCurrency(totalIncome - totalExpense, user?.currency)}
                </h2>
                <div className='flex items-center gap-2 mt-4 text-blue-100 text-sm'>
                  <span className='w-2 h-2 rounded-full bg-green-400' />
                  {user?.name || 'User'} • Last updated today
                </div>
              </div>
              <FaWallet className='absolute -right-6 -bottom-6 w-48 h-48 opacity-10 rotate-12' />
            </div>

            {/* Key Metrics Grid - Fixed for squashing */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
              {[
                { label: 'Monthly Income', val: monthlyStats.monthlyIncome, color: 'text-green-600', bg: 'bg-green-50', icon: FaArrowUp, sub: 'This month' },
                { label: 'Monthly Expense', val: monthlyStats.monthlyExpense, color: 'text-red-600', bg: 'bg-red-50', icon: FaArrowDown, sub: 'This month' },
                { label: 'Total Income', val: totalIncome, color: 'text-blue-600', bg: 'bg-blue-50', icon: FaMoneyBillWave, sub: 'All time' },
                { label: 'Goals Tracking', val: `${goals.filter(g => g.isCompleted).length}/${goals.length}`, color: 'text-purple-600', bg: 'bg-purple-50', icon: FaBullseye, sub: 'Completed' }
              ].map((item, idx) => (
                <div key={idx} className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 min-w-0'>
                  <div className='flex items-start justify-between'>
                    <div className='min-w-0 flex-1'>
                      <p className='text-gray-500 text-xs font-semibold uppercase tracking-wider'>{item.label}</p>
                      <p className={`text-2xl font-bold mt-2 truncate ${item.color}`}>
                        {typeof item.val === 'number' ? formatCurrency(item.val, user?.currency) : item.val}
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>{item.sub}</p>
                    </div>
                    <div className={`${item.bg} p-3 rounded-xl flex-shrink-0 ml-3`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
              <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='font-bold text-gray-800'>Income Sources</h3>
                  <button onClick={() => navigate('/income')} className='text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1'>
                    View All <FaChevronRight className='w-2 h-2' />
                  </button>
                </div>
                <div className='h-72'>{incomePieData ? <Pie data={incomePieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /> : <p className='flex items-center justify-center h-full text-gray-400 italic'>No income data recorded</p>}</div>
              </div>

              <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
                <div className='flex items-center justify-between mb-6'>
                  <h3 className='font-bold text-gray-800'>Expense Breakdown</h3>
                  <button onClick={() => navigate('/expense')} className='text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1'>
                    View All <FaChevronRight className='w-2 h-2' />
                  </button>
                </div>
                <div className='h-72'>{expensePieData ? <Pie data={expensePieData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /> : <p className='flex items-center justify-center h-full text-gray-400 italic'>No expense data recorded</p>}</div>
              </div>
            </div>

            {/* Balance Timeline */}
            <div className='bg-white p-6 rounded-2xl border border-gray-100 shadow-sm'>
              <h3 className='font-bold text-gray-800 mb-6'>Balance Timeline (Last 30 Days)</h3>
              <div className='h-80'>
                {balanceData ? <Line data={balanceData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false } } }} /> : <p className='flex items-center justify-center h-full text-gray-400 italic'>Insufficient data for timeline</p>}
              </div>
            </div>

            {/* AI Insights Card */}
            <AIInsightsCard insights={aiAnalysis?.insights || []} healthScore={financialHealth} />

            {/* Recent Transactions */}
            <div className='bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden'>
              <div className='p-6 flex justify-between items-center border-b border-gray-50'>
                <h3 className='font-bold text-gray-800'>Recent Transactions</h3>
                <span className='px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-medium'>
                  {transactionsPagination.totalCount} total
                </span>
              </div>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='bg-gray-50/50 text-left'>
                      <th className='px-6 py-4 text-xs font-bold uppercase text-gray-400 cursor-pointer' onClick={() => handleTransactionsSort('date')}>Date</th>
                      <th className='px-6 py-4 text-xs font-bold uppercase text-gray-400'>Category</th>
                      <th className='px-6 py-4 text-xs font-bold uppercase text-gray-400'>Description</th>
                      <th className='px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right' onClick={() => handleTransactionsSort('amount')}>Amount</th>
                      <th className='px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-50'>
                    {paginatedTransactions.map((t) => (
                      <tr key={`${t.type}-${t._id}`} className='hover:bg-gray-50/80 transition-colors'>
                        <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(t.displayDate)}</td>
                        <td className='px-6 py-4 text-sm'>
                          <span className='bg-white border border-gray-100 px-2 py-1 rounded-md text-xs font-medium text-gray-600 shadow-sm'>
                            {t.category}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500 truncate max-w-[200px]'>{t.description}</td>
                        <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <div className='flex justify-end gap-4'>
                            <button onClick={() => navigate(t.type === 'income' ? '/income' : '/expense')} className='text-gray-400 hover:text-blue-500 transition-colors'>
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => handleDeleteTransaction(t.type, t._id)} className='text-gray-400 hover:text-red-500 transition-colors'>
                              <FaTrash size={14} />
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
                <div className='p-6 border-t border-gray-50 flex justify-between items-center'>
                  <button
                    disabled={transactionsPagination.page === 1}
                    onClick={() => handleTransactionsPageChange(transactionsPagination.page - 1)}
                    className='px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50'
                  >
                    Previous
                  </button>
                  <span className='text-xs font-medium text-gray-500'>
                    Page {transactionsPagination.page} of {transactionsPagination.totalPages}
                  </span>
                  <button
                    disabled={transactionsPagination.page === transactionsPagination.totalPages}
                    onClick={() => handleTransactionsPageChange(transactionsPagination.page + 1)}
                    className='px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50'
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <SampattiBot />
    </div>
  )
}

export default DashboardPage
