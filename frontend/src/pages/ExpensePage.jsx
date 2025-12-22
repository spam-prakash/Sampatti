import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Pie, Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import {
  FaPlus,
  FaChartPie,
  FaChartLine,
  FaMoneyBillWave,
  FaArrowUp,
  FaBrain,
  FaDownload,
  FaSync,
  FaFilter,
  FaEdit,
  FaTrash,
  FaLightbulb,
  FaExclamationTriangle,
  FaTimes,
  FaTag,
  FaShoppingCart,
  FaHome,
  FaCar,
  FaUtensils,
  FaHeartbeat,
  FaGraduationCap,
  FaGamepad,
  FaListUl,
  FaSortAmountDown,
  FaCalendarAlt
} from 'react-icons/fa'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const ExpensePage = () => {
  const { user } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [allExpenses, setAllExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [categoryData, setCategoryData] = useState(null)
  const [timelineData, setTimelineData] = useState(null)
  const [essentialVsNonEssential, setEssentialVsNonEssential] = useState(null)
  const [totalExpense, setTotalExpense] = useState(0)
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [monthlyAnalysis, setMonthlyAnalysis] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [monthlyTrendData, setMonthlyTrendData] = useState(null)

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10
  })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAiInsights, setShowAiInsights] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [filter, setFilter] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')
  const [selectedEssential, setSelectedEssential] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    location: '',
    merchant: '',
    isEssential: true,
    isRecurring: false,
    recurrenceType: 'Monthly',
    status: 'Completed',
    tags: '',
    notes: ''
  })

  const [bulkFormData, setBulkFormData] = useState([{
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    isEssential: true,
    status: 'Completed'
  }])

  const [editFormData, setEditFormData] = useState({
    id: '',
    amount: '',
    category: '',
    description: '',
    date: '',
    paymentMethod: '',
    location: '',
    merchant: '',
    isEssential: true,
    isRecurring: false,
    recurrenceType: '',
    status: '',
    tags: '',
    notes: ''
  })

  const EXPENSE_CATEGORIES = [
    'Food',
    'Transport',
    'Shopping',
    'Bills',
    'Entertainment',
    'Healthcare',
    'Education',
    'Housing',
    'Personal',
    'Other'
  ]

  const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']
  const STATUS_TYPES = ['Pending', 'Completed', 'Cancelled']
  const RECURRENCE_TYPES = ['Daily', 'Weekly', 'Monthly', 'Yearly']
  const ESSENTIAL_OPTIONS = ['all', 'essential', 'non-essential']

  const CATEGORY_ICONS = {
    Food: <FaUtensils className='text-orange-500' />,
    Transport: <FaCar className='text-blue-500' />,
    Shopping: <FaShoppingCart className='text-pink-500' />,
    Bills: <FaHome className='text-green-500' />,
    Entertainment: <FaGamepad className='text-purple-500' />,
    Healthcare: <FaHeartbeat className='text-red-500' />,
    Education: <FaGraduationCap className='text-indigo-500' />,
    Housing: <FaHome className='text-yellow-500' />,
    Personal: <FaTag className='text-teal-500' />,
    Other: <FaTag className='text-gray-500' />
  }

  const COLORS = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#06b6d4',
    '#0ea5e9',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6'
  ]

  const categoryOptions = useMemo(() => {
    return categories.map(cat => ({
      value: cat._id || cat.name || cat.category,
      label: `${cat._id || cat.name || cat.category} (${cat.count || 0})`
    }))
  }, [categories])

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    filterExpenses()
    generateCharts()
    updatePagination()
  }, [allExpenses, expenses, filter, selectedCategory, selectedPaymentMethod, selectedEssential, selectedStatus, sortBy, sortOrder])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await fetchAllForCharts()
      await fetchExpenses()
      await fetchCategories()
      await fetchStatistics()
      await fetchMonthlyAnalysis()
    } catch (error) {
      toast.error('Failed to fetch expense data')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllForCharts = async () => {
    try {
      const fullResp = await api.get('/expense/all', { params: { limit: 1000 } })
      if (fullResp.success) {
        setAllExpenses(fullResp.data || [])
      }
    } catch (err) {
      console.warn('Could not fetch full expenses for charts:', err.message || err)
    }
  }

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expense/all', { params: { limit: 1000 } })
      if (response.success) {
        setExpenses(response.data || [])
        setFilteredExpenses(response.data || [])

        // IGNORE the backend's pageSize and always use 10
        const totalCount = response.data?.length || 0
        const pageSize = 10 // ALWAYS use 10 items per page
        const totalPages = Math.ceil(totalCount / pageSize)

        setPagination({
          page: 1, // Always start at page 1
          totalPages,
          totalCount,
          pageSize: 10 // <-- Force it to 10, ignore backend's 1000
        })

        const total = (response.data || []).reduce((sum, exp) => sum + exp.amount, 0)
        setTotalExpense(total)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
      throw error
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/expense/categories')
      if (response.success) {
        setCategories(response.data || [])
      } else {
        setCategories(EXPENSE_CATEGORIES.map(cat => ({
          _id: cat,
          name: cat,
          count: 0,
          totalAmount: 0
        })))
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories(EXPENSE_CATEGORIES.map(cat => ({
        _id: cat,
        name: cat,
        count: 0,
        totalAmount: 0
      })))
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/expense/stats')
      if (response.success) {
        setStats(response.data)
        if (response.data.monthlyTrend) {
          generateMonthlyTrendChart(response.data.monthlyTrend)
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMonthlyAnalysis = async () => {
    try {
      const response = await api.get('/expense/monthly-analysis')
      if (response.success) {
        setMonthlyAnalysis(response.data)
      }
    } catch (error) {
      console.error('Error fetching monthly analysis:', error)
    }
  }

  const filterExpenses = useCallback(() => {
    const source = (allExpenses && allExpenses.length > 0) ? allExpenses : expenses
    let filtered = [...source]

    if (filter !== 'all') {
      const now = new Date()
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.date)

        if (filter === 'month') {
          return (
            expDate.getMonth() === now.getMonth() &&
            expDate.getFullYear() === now.getFullYear()
          )
        } else if (filter === 'quarter') {
          const quarter = Math.floor(now.getMonth() / 3)
          return (
            Math.floor(expDate.getMonth() / 3) === quarter &&
            expDate.getFullYear() === now.getFullYear()
          )
        } else if (filter === 'year') {
          return expDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory)
    }

    if (selectedPaymentMethod !== 'all') {
      filtered = filtered.filter(exp => exp.paymentMethod === selectedPaymentMethod)
    }

    if (selectedEssential !== 'all') {
      filtered = filtered.filter(exp =>
        selectedEssential === 'essential' ? exp.isEssential : !exp.isEssential
      )
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(exp => exp.status === selectedStatus)
    }

    setFilteredExpenses(filtered)
    const total = filtered.reduce((sum, exp) => sum + exp.amount, 0)
    setTotalExpense(total)
  }, [allExpenses, expenses, filter, selectedCategory, selectedPaymentMethod, selectedEssential, selectedStatus])

  const updatePagination = () => {
    const totalCount = filteredExpenses.length
    const totalPages = Math.ceil(totalCount / pagination.pageSize)

    setPagination(prev => ({
      ...prev,
      totalPages,
      totalCount,
      page: prev.page > totalPages ? 1 : prev.page
    }))
  }

  const getPaginatedExpenses = () => {
    const sorted = [...filteredExpenses].sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
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
          aValue = new Date(a.date)
          bValue = new Date(b.date)
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize

    return sorted.slice(startIndex, endIndex)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }))
    }
  }

  const generateCharts = () => {
    if (filteredExpenses.length === 0) {
      setCategoryData(null)
      setEssentialVsNonEssential(null)
      setTimelineData(null)
      return
    }

    const categoryTotals = {}
    filteredExpenses.forEach((exp) => {
      if (exp.category) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount
      }
    })

    if (Object.keys(categoryTotals).length > 0) {
      setCategoryData({
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals),
            backgroundColor: COLORS.slice(0, Object.keys(categoryTotals).length),
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      })
    } else {
      setCategoryData(null)
    }

    const essential = filteredExpenses
      .filter((exp) => exp.isEssential)
      .reduce((sum, exp) => sum + exp.amount, 0)
    const nonEssential = filteredExpenses
      .filter((exp) => !exp.isEssential)
      .reduce((sum, exp) => sum + exp.amount, 0)

    if (essential > 0 || nonEssential > 0) {
      setEssentialVsNonEssential({
        labels: ['Essential', 'Non-Essential'],
        datasets: [
          {
            data: [essential, nonEssential],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderColor: '#fff',
            borderWidth: 2
          }
        ]
      })
    } else {
      setEssentialVsNonEssential(null)
    }

    const source = allExpenses && allExpenses.length > 0 ? allExpenses : filteredExpenses

    if (source && source.length > 0) {
      const sortedExpenses = [...source].sort((a, b) => new Date(a.date) - new Date(b.date))

      const groupedByDate = {}
      sortedExpenses.forEach((exp) => {
        const isoKey = formatDateToYYYYMMDD(new Date(exp.date))
        groupedByDate[isoKey] = (groupedByDate[isoKey] || 0) + exp.amount
      })

      const first = new Date(sortedExpenses[0].date)
      const last = new Date(sortedExpenses[sortedExpenses.length - 1].date)

      const labels = []
      const values = []

      for (let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
        const tmp = new Date(d)
        const iso = formatDateToYYYYMMDD(tmp)
        const label = tmp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        labels.push(label)
        values.push(groupedByDate[iso] || 0)
      }

      const lineData = {
        labels,
        datasets: [{
          label: 'Expense Spent',
          data: values,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          cubicInterpolationMode: 'monotone',
          tension: 0.3,
          fill: true,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      }

      setTimelineData(lineData)
    } else {
      setTimelineData(null)
    }
  }

  const generateMonthlyTrendChart = (monthlyTrend) => {
    if (!monthlyTrend || monthlyTrend.length === 0) {
      setMonthlyTrendData(null)
      return
    }

    const groupedByMonth = {}
    monthlyTrend.forEach(item => {
      const monthKey = item.month || `${item._id?.year}-${String(item._id?.month).padStart(2, '0')}`
      if (monthKey) {
        groupedByMonth[monthKey] = (groupedByMonth[monthKey] || 0) + (item.totalAmount || item.amount || 0)
      }
    })

    const sortedMonths = Object.keys(groupedByMonth).sort()

    setMonthlyTrendData({
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-')
        return new Date(year, monthNum - 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric'
        })
      }),
      datasets: [{
        label: 'Monthly Expenses',
        data: sortedMonths.map(month => groupedByMonth[month]),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#ef4444',
        borderWidth: 1
      }]
    })
  }

  const handleAddExpense = async (e) => {
    e.preventDefault()

    if (!formData.amount || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: new Date(formData.date),
        paymentMethod: formData.paymentMethod,
        location: formData.location,
        merchant: formData.merchant,
        isEssential: formData.isEssential,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        notes: formData.notes
      }

      const response = await api.post('/expense/add', payload)

      if (response.success) {
        toast.success('Expense added successfully!')
        setFormData({
          amount: '',
          category: 'Food',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Cash',
          location: '',
          merchant: '',
          isEssential: true,
          isRecurring: false,
          recurrenceType: 'Monthly',
          status: 'Completed',
          tags: '',
          notes: ''
        })
        setShowAddModal(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add expense')
    }
  }

  const handleBulkAdd = async (e) => {
    e.preventDefault()

    const validExpenses = bulkFormData.filter(item =>
      item.amount && item.category && item.date
    )

    if (validExpenses.length === 0) {
      toast.error('Please add at least one valid expense entry')
      return
    }

    try {
      const response = await api.post('/expense/bulk-add', {
        expenses: validExpenses.map(item => ({
          amount: parseFloat(item.amount),
          category: item.category,
          description: item.description,
          date: new Date(item.date),
          paymentMethod: item.paymentMethod,
          isEssential: item.isEssential,
          status: item.status || 'Completed'
        }))
      })

      if (response.success) {
        toast.success(`${response.data.count || validExpenses.length} expenses added successfully!`)
        setBulkFormData([{
          amount: '',
          category: 'Food',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Cash',
          isEssential: true,
          status: 'Completed'
        }])
        setShowBulkAdd(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add expenses')
    }
  }

  const handleEditExpense = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        amount: parseFloat(editFormData.amount),
        category: editFormData.category,
        description: editFormData.description,
        date: new Date(editFormData.date),
        paymentMethod: editFormData.paymentMethod,
        location: editFormData.location,
        merchant: editFormData.merchant,
        isEssential: editFormData.isEssential,
        isRecurring: editFormData.isRecurring,
        recurrenceType: editFormData.isRecurring ? editFormData.recurrenceType : null,
        status: editFormData.status,
        tags: editFormData.tags ? editFormData.tags.split(',').map(tag => tag.trim()) : [],
        notes: editFormData.notes
      }

      const response = await api.put(`/expense/update/${editFormData.id}`, payload)

      if (response.success) {
        toast.success('Expense updated successfully!')
        setShowEditModal(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update expense')
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return
    }

    try {
      const response = await api.delete(`/expense/delete/${expenseId}`)
      if (response.success) {
        toast.success('Expense deleted successfully!')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  const handleToggleEssential = async (expenseId) => {
    try {
      const response = await api.put(`/expense/toggle-essential/${expenseId}`)
      if (response.success) {
        toast.success(response.message)
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to update expense')
    }
  }

  const fetchAiInsights = async () => {
    try {
      const response = await api.get('/expense/ai-insights')
      if (response.success) {
        setAiInsights(response.data)
        setShowAiInsights(true)
      }
    } catch (error) {
      if (error.response?.status === 503) {
        toast.error('AI Service is currently unavailable')
      } else {
        toast.error('Failed to fetch AI insights')
      }
    }
  }

  const openEditForm = (expense) => {
    setEditFormData({
      id: expense._id,
      amount: expense.amount,
      category: expense.category,
      description: expense.description || '',
      date: formatDateToYYYYMMDD(new Date(expense.date)),
      paymentMethod: expense.paymentMethod || 'Cash',
      location: expense.location || '',
      merchant: expense.merchant || '',
      isEssential: expense.isEssential !== undefined ? expense.isEssential : true,
      isRecurring: expense.isRecurring || false,
      recurrenceType: expense.recurrenceType || 'Monthly',
      status: expense.status || 'Completed',
      tags: expense.tags ? expense.tags.join(', ') : '',
      notes: expense.notes || ''
    })
    setShowEditModal(true)
  }

  const addBulkRow = () => {
    setBulkFormData([...bulkFormData, {
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      isEssential: true,
      status: 'Completed'
    }])
  }

  const removeBulkRow = (index) => {
    if (bulkFormData.length > 1) {
      setBulkFormData(bulkFormData.filter((_, i) => i !== index))
    }
  }

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalExpenses: filteredExpenses.length,
      totalAmount: totalExpense,
      expenses: filteredExpenses.map(exp => ({
        amount: exp.amount,
        category: exp.category,
        description: exp.description,
        date: exp.date,
        paymentMethod: exp.paymentMethod,
        isEssential: exp.isEssential,
        status: exp.status,
        tags: exp.tags,
        notes: exp.notes
      }))
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `expense-data-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    toast.success('Data exported successfully!')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleBulkFormChange = (index, field, value) => {
    const newData = [...bulkFormData]
    newData[index] = { ...newData[index], [field]: value }
    setBulkFormData(newData)
  }

  const openAddModal = () => {
    setFormData({
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      location: '',
      merchant: '',
      isEssential: true,
      isRecurring: false,
      recurrenceType: 'Monthly',
      status: 'Completed',
      tags: '',
      notes: ''
    })
    setShowAddModal(true)
  }

  const openBulkAddModal = () => {
    setBulkFormData([{
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      isEssential: true,
      status: 'Completed'
    }])
    setShowBulkAdd(true)
  }

  const paginatedExpenses = getPaginatedExpenses()

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader size='lg' />
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-gray-50 overflow-hidden'>
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className='flex-1 flex flex-col min-w-0 relative overflow-y-auto'>
        <Header onMenuClick={toggleSidebar} />
        <main className='flex-1 p-4 md:p-8'>
          <div className='max-w-7xl mx-auto'>
            {/* Header */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Expense Management</h1>
                <p className='text-gray-600 mt-1'>Track, analyze and optimize your spending patterns</p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <button
                  onClick={fetchAiInsights}
                  className='btn-primary flex items-center gap-2 bg-purple-600 hover:bg-purple-700'
                >
                  <FaBrain />
                  AI Insights
                </button>
                <button
                  onClick={exportData}
                  className='btn-secondary flex items-center gap-2'
                >
                  <FaDownload />
                  Export
                </button>
                <button
                  onClick={openBulkAddModal}
                  className='btn-secondary flex items-center gap-2'
                >
                  <FaListUl />
                  Bulk Add
                </button>
                <button
                  onClick={openAddModal}
                  className='btn-primary flex items-center gap-2'
                >
                  <FaPlus />
                  Add Expense
                </button>
              </div>
            </div>

            {/* Add Expense Modal */}
            {showAddModal && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowAddModal(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>Add New Expense</h3>
                        <button
                          type='button'
                          onClick={() => setShowAddModal(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleAddExpense} className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Amount *
                            </label>
                            <input
                              type='number'
                              name='amount'
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder='Enter amount'
                              step='0.01'
                              min='0.01'
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Category *
                            </label>
                            <select
                              name='category'
                              value={formData.category}
                              onChange={handleChange}
                              className='input-field'
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Date *
                            </label>
                            <input
                              type='date'
                              name='date'
                              value={formData.date}
                              onChange={handleChange}
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Payment Method
                            </label>
                            <select
                              name='paymentMethod'
                              value={formData.paymentMethod}
                              onChange={handleChange}
                              className='input-field'
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>
                                  {method}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Location
                            </label>
                            <input
                              type='text'
                              name='location'
                              value={formData.location}
                              onChange={handleChange}
                              placeholder='e.g., Restaurant Name, City'
                              className='input-field'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Merchant
                            </label>
                            <input
                              type='text'
                              name='merchant'
                              value={formData.merchant}
                              onChange={handleChange}
                              placeholder='e.g., Store Name'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Description
                            </label>
                            <input
                              type='text'
                              name='description'
                              value={formData.description}
                              onChange={handleChange}
                              placeholder='Optional notes'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Tags (comma separated)
                            </label>
                            <input
                              type='text'
                              name='tags'
                              value={formData.tags}
                              onChange={handleChange}
                              placeholder='e.g., groceries, travel, bill'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Notes
                            </label>
                            <textarea
                              name='notes'
                              value={formData.notes}
                              onChange={handleChange}
                              placeholder='Additional notes...'
                              className='input-field'
                              rows='2'
                            />
                          </div>
                        </div>

                        <div className='space-y-4'>
                          <div className='flex flex-wrap items-center gap-4'>
                            <div className='flex items-center'>
                              <input
                                type='checkbox'
                                name='isEssential'
                                checked={formData.isEssential}
                                onChange={handleChange}
                                className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                                id='isEssential'
                              />
                              <label htmlFor='isEssential' className='ml-2 text-sm text-gray-700'>
                                Essential Expense
                              </label>
                            </div>

                            <div className='flex items-center'>
                              <input
                                type='checkbox'
                                name='isRecurring'
                                checked={formData.isRecurring}
                                onChange={handleChange}
                                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                id='isRecurring'
                              />
                              <label htmlFor='isRecurring' className='ml-2 text-sm text-gray-700'>
                                Recurring Expense
                              </label>
                            </div>

                            {formData.isRecurring && (
                              <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>Recurrence Type</label>
                                <select
                                  name='recurrenceType'
                                  value={formData.recurrenceType}
                                  onChange={handleChange}
                                  className='input-field text-sm'
                                >
                                  {RECURRENCE_TYPES.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                              <select
                                name='status'
                                value={formData.status}
                                onChange={handleChange}
                                className='input-field text-sm'
                              >
                                {STATUS_TYPES.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className='flex gap-2 pt-4'>
                          <button type='submit' className='btn-primary flex-1'>
                            Add Expense
                          </button>
                          <button
                            type='button'
                            onClick={() => setShowAddModal(false)}
                            className='btn-secondary'
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Expense Modal */}
            {showEditModal && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowEditModal(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>Edit Expense</h3>
                        <button
                          type='button'
                          onClick={() => setShowEditModal(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleEditExpense} className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Amount *
                            </label>
                            <input
                              type='number'
                              name='amount'
                              value={editFormData.amount}
                              onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                              placeholder='Enter amount'
                              step='0.01'
                              min='0.01'
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Category *
                            </label>
                            <select
                              name='category'
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className='input-field'
                            >
                              {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Date *
                            </label>
                            <input
                              type='date'
                              name='date'
                              value={editFormData.date}
                              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Payment Method
                            </label>
                            <select
                              name='paymentMethod'
                              value={editFormData.paymentMethod}
                              onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                              className='input-field'
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>
                                  {method}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Location
                            </label>
                            <input
                              type='text'
                              name='location'
                              value={editFormData.location}
                              onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                              placeholder='e.g., Restaurant Name, City'
                              className='input-field'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Merchant
                            </label>
                            <input
                              type='text'
                              name='merchant'
                              value={editFormData.merchant}
                              onChange={(e) => setEditFormData({ ...editFormData, merchant: e.target.value })}
                              placeholder='e.g., Store Name'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Description
                            </label>
                            <input
                              type='text'
                              name='description'
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              placeholder='Optional notes'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Tags (comma separated)
                            </label>
                            <input
                              type='text'
                              name='tags'
                              value={editFormData.tags}
                              onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                              placeholder='e.g., groceries, travel, bill'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                              Notes
                            </label>
                            <textarea
                              name='notes'
                              value={editFormData.notes}
                              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                              placeholder='Additional notes...'
                              className='input-field'
                              rows='2'
                            />
                          </div>
                        </div>

                        <div className='flex flex-wrap items-center gap-4'>
                          <div className='flex items-center'>
                            <input
                              type='checkbox'
                              name='isEssential'
                              checked={editFormData.isEssential}
                              onChange={(e) => setEditFormData({ ...editFormData, isEssential: e.target.checked })}
                              className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                              id='editIsEssential'
                            />
                            <label htmlFor='editIsEssential' className='ml-2 text-sm text-gray-700'>
                              Essential Expense
                            </label>
                          </div>

                          <div className='flex items-center'>
                            <input
                              type='checkbox'
                              name='isRecurring'
                              checked={editFormData.isRecurring}
                              onChange={(e) => setEditFormData({ ...editFormData, isRecurring: e.target.checked })}
                              className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                              id='editIsRecurring'
                            />
                            <label htmlFor='editIsRecurring' className='ml-2 text-sm text-gray-700'>
                              Recurring Expense
                            </label>
                          </div>

                          {editFormData.isRecurring && (
                            <div>
                              <label className='block text-sm font-medium text-gray-700 mb-1'>Recurrence Type</label>
                              <select
                                name='recurrenceType'
                                value={editFormData.recurrenceType}
                                onChange={(e) => setEditFormData({ ...editFormData, recurrenceType: e.target.value })}
                                className='input-field text-sm'
                              >
                                {RECURRENCE_TYPES.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                            <select
                              name='status'
                              value={editFormData.status}
                              onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                              className='input-field text-sm'
                            >
                              {STATUS_TYPES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className='flex gap-2 pt-4'>
                          <button type='submit' className='btn-primary flex-1'>
                            Update Expense
                          </button>
                          <button
                            type='button'
                            onClick={() => setShowEditModal(false)}
                            className='btn-secondary'
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bulk Add Modal */}
            {showBulkAdd && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowBulkAdd(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Bulk Add Expenses {bulkFormData.length > 1 && `(${bulkFormData.length} rows)`}
                        </h3>
                        <button
                          type='button'
                          onClick={() => setShowBulkAdd(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleBulkAdd} className='space-y-4'>
                        <div className='space-y-4 max-h-96 overflow-y-auto pr-2'>
                          {bulkFormData.map((item, index) => (
                            <div key={index} className='bg-gray-50 p-4 rounded-lg border border-gray-200'>
                              <div className='flex justify-between items-center mb-3'>
                                <h4 className='font-medium text-gray-700'>Expense #{index + 1}</h4>
                                {bulkFormData.length > 1 && (
                                  <button
                                    type='button'
                                    onClick={() => removeBulkRow(index)}
                                    className='text-red-600 hover:text-red-800 text-sm'
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Amount *</label>
                                  <input
                                    type='number'
                                    value={item.amount}
                                    onChange={(e) => handleBulkFormChange(index, 'amount', e.target.value)}
                                    placeholder='Amount'
                                    step='0.01'
                                    min='0.01'
                                    className='input-field text-sm'
                                    required
                                  />
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Category *</label>
                                  <select
                                    value={item.category}
                                    onChange={(e) => handleBulkFormChange(index, 'category', e.target.value)}
                                    className='input-field text-sm'
                                  >
                                    {EXPENSE_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Date *</label>
                                  <input
                                    type='date'
                                    value={item.date}
                                    onChange={(e) => handleBulkFormChange(index, 'date', e.target.value)}
                                    className='input-field text-sm'
                                    required
                                  />
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Payment Method</label>
                                  <select
                                    value={item.paymentMethod}
                                    onChange={(e) => handleBulkFormChange(index, 'paymentMethod', e.target.value)}
                                    className='input-field text-sm'
                                  >
                                    {PAYMENT_METHODS.map((method) => (
                                      <option key={method} value={method}>{method}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className='md:col-span-2'>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                                  <input
                                    type='text'
                                    value={item.description}
                                    onChange={(e) => handleBulkFormChange(index, 'description', e.target.value)}
                                    placeholder='Description'
                                    className='input-field text-sm'
                                  />
                                </div>
                                <div className='flex items-center gap-4'>
                                  <div className='flex items-center'>
                                    <input
                                      type='checkbox'
                                      checked={item.isEssential}
                                      onChange={(e) => handleBulkFormChange(index, 'isEssential', e.target.checked)}
                                      className='rounded border-gray-300 text-green-600 focus:ring-green-500'
                                      id={`bulkEssential-${index}`}
                                    />
                                    <label htmlFor={`bulkEssential-${index}`} className='ml-2 text-sm text-gray-700'>
                                      Essential
                                    </label>
                                  </div>
                                  <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>Status</label>
                                    <select
                                      value={item.status}
                                      onChange={(e) => handleBulkFormChange(index, 'status', e.target.value)}
                                      className='input-field text-sm'
                                    >
                                      {STATUS_TYPES.map((status) => (
                                        <option key={status} value={status}>{status}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className='flex justify-between items-center pt-4'>
                          <button
                            type='button'
                            onClick={addBulkRow}
                            className='btn-secondary flex items-center gap-2 text-sm'
                          >
                            <FaPlus /> Add Another Row
                          </button>

                          <div className='flex gap-2'>
                            <button type='button' onClick={() => setShowBulkAdd(false)} className='btn-secondary'>
                              Cancel
                            </button>
                            <button type='submit' className='btn-primary'>
                              Add {bulkFormData.length} Expense{bulkFormData.length !== 1 ? 's' : ''}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Modal */}
            {showAiInsights && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowAiInsights(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>AI Expense Insights</h3>
                        <button
                          type='button'
                          onClick={() => setShowAiInsights(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {aiInsights
                        ? (
                          <div className='space-y-6'>
                            <div className='bg-gradient-to-r from-purple-50 to-red-50 p-4 rounded-lg border border-purple-200'>
                              <div className='flex items-center gap-3 mb-4'>
                                <FaBrain className='w-6 h-6 text-purple-600' />
                                <h3 className='text-lg font-semibold text-gray-900'>Smart Spending Analysis</h3>
                              </div>

                              {aiInsights
                                ? (
                                  <div className='space-y-4'>
                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                      <div className='bg-white p-4 rounded-lg shadow-sm'>
                                        <h4 className='font-medium text-gray-700 mb-2'>Pattern Analysis</h4>
                                        <ul className='space-y-2'>
                                          {aiInsights.insights?.map((insight, index) => (
                                            <li key={index} className='flex items-start gap-2 text-sm'>
                                              <FaLightbulb className='w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0' />
                                              <span>{insight}</span>
                                            </li>
                                          )) || (
                                            <li className='text-gray-500 text-sm'>No insights available</li>
                                          )}
                                        </ul>
                                      </div>

                                      <div className='bg-white p-4 rounded-lg shadow-sm'>
                                        <h4 className='font-medium text-gray-700 mb-2'>Spending Breakdown</h4>
                                        <div className='space-y-3'>
                                          {aiInsights.essentialSpending && (
                                            <div>
                                              <p className='text-sm text-gray-600'>Essential Spending</p>
                                              <p className='text-xl font-bold text-green-600'>
                                                {formatCurrency(aiInsights.essentialSpending.total || 0, user?.currency)}
                                              </p>
                                              <p className='text-xs text-gray-500'>
                                                {aiInsights.essentialSpending.percentage} of total
                                              </p>
                                            </div>
                                          )}
                                          {aiInsights.nonEssentialSpending && (
                                            <div>
                                              <p className='text-sm text-gray-600'>Non-Essential Spending</p>
                                              <p className='text-xl font-bold text-yellow-600'>
                                                {formatCurrency(aiInsights.nonEssentialSpending.total || 0, user?.currency)}
                                              </p>
                                              <p className='text-xs text-gray-500'>
                                                {aiInsights.nonEssentialSpending.percentage} of total
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {aiInsights.suggestions && (
                                      <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                                        <div className='flex items-center gap-2 mb-2'>
                                          <FaLightbulb className='w-5 h-5 text-red-600' />
                                          <h4 className='font-semibold text-red-800'>Recommendations</h4>
                                        </div>
                                        <ul className='space-y-1'>
                                          {aiInsights.suggestions.map((suggestion, index) => (
                                            <li key={index} className='text-red-700 text-sm'>{suggestion}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                  )
                                : (
                                  <div className='text-center py-8'>
                                    <FaLightbulb className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
                                    <p className='text-gray-600'>No AI insights available yet</p>
                                    <p className='text-gray-500 text-sm mt-2'>Add more expense data to get personalized insights</p>
                                  </div>
                                  )}
                            </div>
                          </div>
                          )
                        : (
                          <div className='text-center py-8'>
                            <Loader />
                            <p className='mt-4 text-gray-600'>Generating AI insights...</p>
                          </div>
                          )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Modal */}
            {showStats && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowStats(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>Detailed Expense Statistics</h3>
                        <button
                          type='button'
                          onClick={() => setShowStats(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      {stats ? (
                        <div className='space-y-6'>
                          {/* Summary Cards */}
                          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Total Amount</p>
                              <p className='text-2xl font-bold text-red-600'>
                                {formatCurrency(stats.data?.summary?.totalAmount || 0, user?.currency)}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Average Expense</p>
                              <p className='text-2xl font-bold text-blue-600'>
                                {formatCurrency(stats.data?.summary?.averageAmount || 0, user?.currency)}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Total Transactions</p>
                              <p className='text-2xl font-bold text-purple-600'>
                                {stats.data?.summary?.count || 0}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Essential Expenses</p>
                              <p className='text-2xl font-bold text-green-600'>
                                {stats.data?.summary?.essentialCount || 0}
                              </p>
                            </div>
                          </div>

                          {/* Category Breakdown */}
                          {stats.data?.categoryBreakdown && Object.keys(stats.data.categoryBreakdown).length > 0 && (
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <h3 className='font-semibold text-gray-900 mb-4'>Category Breakdown</h3>
                              <div className='space-y-3'>
                                {Object.entries(stats.data.categoryBreakdown).map(([category, data]) => (
                                  <div key={category} className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <div className='w-3 h-3 rounded-full' style={{ backgroundColor: COLORS[Object.keys(stats.data.categoryBreakdown).indexOf(category) % COLORS.length] }} />
                                      <span className='font-medium'>{category}</span>
                                    </div>
                                    <div className='text-right'>
                                      <p className='font-semibold'>{formatCurrency(data.total, user?.currency)}</p>
                                      <p className='text-sm text-gray-600'>{data.count} transactions</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Monthly Trend Chart */}
                          {stats.data?.monthlyTrend && stats.data.monthlyTrend.length > 0 && (
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <h3 className='font-semibold text-gray-900 mb-4'>Spending Trend</h3>
                              <div className='h-64'>
                                {(() => {
                                  const trendData = stats.data.monthlyTrend
                                  const groupedByMonth = {}

                                  trendData.forEach(item => {
                                    const monthKey = item.month
                                    if (monthKey) {
                                      groupedByMonth[monthKey] = (groupedByMonth[monthKey] || 0) + (item.amount || item.totalAmount || 0)
                                    }
                                  })

                                  const sortedMonths = Object.keys(groupedByMonth).sort()

                                  const chartData = {
                                    labels: sortedMonths.map(month => {
                                      const [year, monthNum] = month.split('-')
                                      return new Date(year, monthNum - 1).toLocaleDateString('en-US', {
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    }),
                                    datasets: [{
                                      label: 'Monthly Expenses',
                                      data: sortedMonths.map(month => groupedByMonth[month]),
                                      backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                      borderColor: '#ef4444',
                                      borderWidth: 1
                                    }]
                                  }

                                  return (
                                    <Bar
                                      data={chartData}
                                      options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                          legend: { display: false }
                                        },
                                        scales: {
                                          y: {
                                            beginAtZero: true,
                                            ticks: {
                                              callback: function (value) {
                                                return formatCurrency(value, user?.currency, true)
                                              }
                                            }
                                          }
                                        }
                                      }}
                                    />
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='text-center py-8'>
                          <FaExclamationTriangle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
                          <p className='text-gray-600'>Statistics are not available</p>
                          <p className='text-gray-500 text-sm mt-2'>Try adding some expense data first</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Analysis Card */}
            {monthlyAnalysis && monthlyAnalysis.data && (
              <div className='card mb-6'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaCalendarAlt /> Monthly Spending Analysis
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
                    <p className='text-sm text-red-700'>Total This Month</p>
                    <p className='text-2xl font-bold text-red-700 mt-1'>
                      {formatCurrency(monthlyAnalysis.data.totalAmount, user?.currency)}
                    </p>
                    <p className='text-xs text-red-600 mt-1'>
                      {monthlyAnalysis.data.transactionCount} transactions
                    </p>
                  </div>
                  <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                    <p className='text-sm text-green-700'>Essential Spending</p>
                    <p className='text-2xl font-bold text-green-700 mt-1'>
                      {formatCurrency(monthlyAnalysis.data.essentialAmount, user?.currency)}
                    </p>
                    <p className='text-xs text-green-600 mt-1'>
                      {monthlyAnalysis.data.essentialPercentage}
                    </p>
                  </div>
                  <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                    <p className='text-sm text-blue-700'>Month-over-Month</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      monthlyAnalysis.data.monthOverMonthChange?.includes('-')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                    >
                      {monthlyAnalysis.data.monthOverMonthChange}
                    </p>
                    <p className='text-xs text-blue-600 mt-1'>
                      {monthlyAnalysis.data.monthOverMonthChange?.includes('-')
                        ? 'Decrease from last month'
                        : 'Increase from last month'}
                    </p>
                  </div>
                </div>
                {monthlyAnalysis.data.suggestion && (
                  <div className='mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-700'>{monthlyAnalysis.data.suggestion}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stats and Filters */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Total Expenses</p>
                    <p className='text-2xl font-bold text-red-600 mt-1'>
                      {formatCurrency(totalExpense, user?.currency)}
                    </p>
                  </div>
                  <FaMoneyBillWave className='w-10 h-10 text-red-400' />
                </div>
              </div>

              <div className='card'>
                <div>
                  <p className='text-gray-600 text-sm'>Transactions</p>
                  <p className='text-2xl font-bold text-blue-600 mt-1'>{filteredExpenses.length}</p>
                </div>
              </div>

              <div className='card'>
                <div>
                  <p className='text-gray-600 text-sm'>Average Expense</p>
                  <p className='text-2xl font-bold text-purple-600 mt-1'>
                    {formatCurrency(filteredExpenses.length > 0 ? totalExpense / filteredExpenses.length : 0, user?.currency)}
                  </p>
                </div>
              </div>

              <div className='card'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Filter by Period
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className='input-field text-sm'
                  >
                    <option value='all'>All Time</option>
                    <option value='month'>This Month</option>
                    <option value='quarter'>This Quarter</option>
                    <option value='year'>This Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Filter by Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className='input-field text-sm'
                >
                  <option value='all'>All Categories</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Filter by Payment
                </label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  className='input-field text-sm'
                >
                  <option value='all'>All Payment Methods</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Filter by Essential
                </label>
                <select
                  value={selectedEssential}
                  onChange={(e) => setSelectedEssential(e.target.value)}
                  className='input-field text-sm'
                >
                  <option value='all'>All Expenses</option>
                  <option value='essential'>Essential Only</option>
                  <option value='non-essential'>Non-Essential Only</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Filter by Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className='input-field text-sm'
                >
                  <option value='all'>All Status</option>
                  {STATUS_TYPES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sorting Controls */}
            <div className='mb-6 flex items-center gap-4'>
              <span className='text-sm font-medium text-gray-700'>Sort by:</span>
              <div className='flex gap-2'>
                <button
                  onClick={() => handleSort('date')}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    sortBy === 'date' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaCalendarAlt />
                  Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('amount')}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    sortBy === 'amount' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaSortAmountDown />
                  Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSort('category')}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    sortBy === 'category' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <FaTag />
                  Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>

            {/* Charts */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaChartPie />
                  Expenses by Category
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
                                font: { size: 12 },
                                usePointStyle: true
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-10'>No expense data available</p>
                    )}
              </div>

              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaArrowUp />
                  Essential vs Non-Essential
                </h3>
                {essentialVsNonEssential && essentialVsNonEssential.labels.length > 0
                  ? (
                    <div className='relative h-80'>
                      <Pie
                        data={essentialVsNonEssential}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: { size: 12 },
                                usePointStyle: true
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-10'>No expense data available</p>
                    )}
              </div>
            </div>

            {/* Timeline Chart */}
            <div className='card mb-8'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                <FaChartLine />
                Expense Timeline
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
                            labels: { font: { size: 12 } }
                          }
                        },
                        scales: {
                          y: { beginAtZero: true, ticks: { callback: (val) => formatCurrency(val) } }
                        }
                      }}
                    />
                  </div>
                  )
                : (
                  <p className='text-gray-500 text-center py-10'>No expense data available for timeline</p>
                  )}
            </div>

            {/* Recent Transactions */}
            <div className='card'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Recent Transactions</h3>
                <div className='text-sm text-gray-600'>
                  Showing {paginatedExpenses.length} of {filteredExpenses.length} transactions
                </div>
              </div>

              {paginatedExpenses.length > 0
                ? (
                  <>
                    <div className='overflow-x-auto'>
                      <table className='w-full'>
                        <thead>
                          <tr className='border-b border-gray-200'>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleSort('date')}
                                className='flex items-center gap-1 hover:text-blue-600'
                              >
                                <FaCalendarAlt className='w-4 h-4' />
                                Date
                                {sortBy === 'date' && (
                                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleSort('category')}
                                className='flex items-center gap-1 hover:text-blue-600'
                              >
                                <FaTag className='w-4 h-4' />
                                Category
                                {sortBy === 'category' && (
                                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Description
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Payment
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Status
                            </th>
                            <th className='text-right py-3 px-4 text-sm font-semibold text-gray-700'>
                              <button
                                onClick={() => handleSort('amount')}
                                className='flex items-center gap-1 hover:text-blue-600 justify-end'
                              >
                                <FaSortAmountDown className='w-4 h-4' />
                                Amount
                                {sortBy === 'amount' && (
                                  <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </button>
                            </th>
                            <th className='text-right py-3 px-4 text-sm font-semibold text-gray-700'>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedExpenses.map((expense) => (
                            <tr
                              key={expense._id}
                              className='border-b border-gray-100 hover:bg-gray-50 transition'
                            >
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                <div className='flex flex-col'>
                                  <span>{formatDate(expense.date)}</span>
                                  {expense.isRecurring && (
                                    <span className='text-xs text-yellow-600 mt-1'>
                                      <FaSync className='inline w-3 h-3 mr-1' />
                                      {expense.recurrenceType}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className='py-3 px-4 text-sm'>
                                <div className='flex items-center gap-2'>
                                  {CATEGORY_ICONS[expense.category] || <FaTag className='text-gray-500' />}
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    expense.isEssential
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}
                                  >
                                    {expense.category}
                                  </span>
                                </div>
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600 max-w-xs truncate'>
                                {expense.description || '-'}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {expense.paymentMethod || 'Cash'}
                              </td>
                              <td className='py-3 px-4 text-sm'>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  expense.status === 'Completed'
                                    ? 'bg-green-100 text-green-700'
                                    : expense.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                                >
                                  {expense.status}
                                </span>
                              </td>
                              <td className='py-3 px-4 text-sm font-semibold text-red-600 text-right'>
                                -{formatCurrency(expense.amount, user?.currency)}
                              </td>
                              <td className='py-3 px-4 text-sm text-right space-x-2'>
                                <div className='flex justify-end gap-2'>
                                  <button
                                    onClick={() => openEditForm(expense)}
                                    className='text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1'
                                  >
                                    <FaEdit className='w-3 h-3' /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpense(expense._id)}
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

                    {/* PAGINATION - ALWAYS SHOW EVEN IF ONLY 1 PAGE */}
                    <div className='flex justify-between items-center mt-6 pt-6 border-t border-gray-200'>
                      <div className='text-sm text-gray-600'>
                        Page {pagination.page} of {pagination.totalPages}
                        <span className='ml-2'>({filteredExpenses.length} total records)</span>
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page <= 1}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            pagination.page <= 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page >= pagination.totalPages}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            pagination.page >= pagination.totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                  )
                : (
                  <div className='text-center py-10'>
                    <FaShoppingCart className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-500 text-lg'>No expense transactions found</p>
                    <p className='text-gray-400 text-sm mt-2'>Try adjusting your filters or add new expense records</p>
                    <button
                      onClick={openAddModal}
                      className='btn-primary mt-4'
                    >
                      Add Your First Expense
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

export default ExpensePage
