import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
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
  ArcElement
} from 'chart.js'
import {
  FaPlus,
  FaChartPie,
  FaChartLine,
  FaMoneyBillWave,
  FaFilter,
  FaDownload,
  FaRobot,
  FaSync,
  FaCalendarAlt,
  FaTag,
  FaEdit,
  FaTrash,
  FaBrain,
  FaLightbulb,
  FaExclamationTriangle,
  FaTimes,
  FaListUl,
  FaSortAmountDown
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const IncomePage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [incomes, setIncomes] = useState([])
  const [filteredIncomes, setFilteredIncomes] = useState([])
  const [stats, setStats] = useState(null)
  const [categories, setCategories] = useState([])
  const [sources, setSources] = useState([])
  const [recurringAnalysis, setRecurringAnalysis] = useState(null)
  const [aiInsights, setAiInsights] = useState(null)
  const [categoryData, setCategoryData] = useState(null)
  const [timelineData, setTimelineData] = useState(null)
  const [monthlyTrendData, setMonthlyTrendData] = useState(null)
  const [totalIncome, setTotalIncome] = useState(0)

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
  const [selectedSource, setSelectedSource] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const [formData, setFormData] = useState({
    amount: '',
    category: 'Salary',
    description: '',
    creditedOn: new Date().toISOString().split('T')[0],
    source: '',
    isRecurring: false,
    recurrenceType: 'Monthly',
    status: 'Received',
    tags: ''
  })

  const [bulkFormData, setBulkFormData] = useState([{
    amount: '',
    category: 'Salary',
    description: '',
    creditedOn: new Date().toISOString().split('T')[0],
    source: '',
    isRecurring: false
  }])

  const [editFormData, setEditFormData] = useState({
    id: '',
    amount: '',
    category: '',
    description: '',
    creditedOn: '',
    source: '',
    isRecurring: false,
    recurrenceType: '',
    status: ''
  })

  const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Bonus', 'Gift', 'Other']
  const RECURRENCE_TYPES = ['Daily', 'Weekly', 'Monthly', 'Yearly']
  const STATUS_TYPES = ['Pending', 'Received', 'Cancelled']
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    filterIncome()
    generateCharts()
    updatePagination()
  }, [incomes, filter, selectedCategory, selectedSource, selectedStatus, sortBy, sortOrder])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const incomeResponse = await api.get('/income/all', { params: { limit: 1000 } })

      if (incomeResponse.success) {
        setIncomes(incomeResponse.data || [])
      } else {
        toast.error(incomeResponse.message || 'Failed to fetch income data')
      }

      try {
        const statsResponse = await api.get('/income/stats')
        if (statsResponse.success) {
          setStats(statsResponse.data)
        }
      } catch (statsError) {
        console.log('Stats fetch error:', statsError.message)
      }

      try {
        const categoriesResponse = await api.get('/income/categories')
        if (categoriesResponse.success) {
          const categoryList = categoriesResponse.data.map(item => ({
            name: item._id,
            count: item.count,
            totalAmount: item.totalAmount,
            avgAmount: item.avgAmount
          }))
          setCategories(categoryList)
        }
      } catch (categoriesError) {
        console.log('Categories fetch error:', categoriesError.message)
        const defaultCategories = INCOME_CATEGORIES.map(cat => ({
          name: cat,
          count: 0,
          totalAmount: 0,
          avgAmount: 0
        }))
        setCategories(defaultCategories)
      }

      try {
        const sourcesResponse = await api.get('/income/sources')
        if (sourcesResponse.success) {
          const sourceList = sourcesResponse.data.map(item => ({
            name: item._id || 'Unknown',
            count: item.count,
            totalAmount: item.totalAmount,
            recurringPercentage: item.recurringPercentage || '0'
          }))
          setSources(sourceList)
        }
      } catch (sourcesError) {
        console.log('Sources fetch error:', sourcesError.message)
        setSources([])
      }

      try {
        const recurringResponse = await api.get('/income/recurring-analysis')
        if (recurringResponse.success) {
          setRecurringAnalysis(recurringResponse.data)
        }
      } catch (recurringError) {
        console.log('Recurring analysis fetch error:', recurringError.message)
      }
    } catch (error) {
      toast.error('Failed to fetch income data')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterIncome = () => {
    let filtered = incomes

    if (filter !== 'all') {
      const now = new Date()
      filtered = filtered.filter((inc) => {
        const incDate = new Date(inc.creditedOn)

        if (filter === 'month') {
          return (
            incDate.getMonth() === now.getMonth() &&
            incDate.getFullYear() === now.getFullYear()
          )
        } else if (filter === 'quarter') {
          const quarter = Math.floor(now.getMonth() / 3)
          return (
            Math.floor(incDate.getMonth() / 3) === quarter &&
            incDate.getFullYear() === now.getFullYear()
          )
        } else if (filter === 'year') {
          return incDate.getFullYear() === now.getFullYear()
        }
        return true
      })
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(inc => inc.category === selectedCategory)
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(inc => inc.source === selectedSource)
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(inc => inc.status === selectedStatus)
    }

    setFilteredIncomes(filtered)
    const total = filtered.reduce((sum, inc) => sum + inc.amount, 0)
    setTotalIncome(total)
  }

  const updatePagination = () => {
    const totalCount = filteredIncomes.length
    const totalPages = Math.ceil(totalCount / pagination.pageSize)

    setPagination(prev => ({
      ...prev,
      totalPages,
      totalCount,
      page: prev.page > totalPages ? 1 : prev.page
    }))
  }

  const getPaginatedIncomes = () => {
    const sorted = [...filteredIncomes].sort((a, b) => {
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
        case 'source':
          aValue = a.source || ''
          bValue = b.source || ''
          break
        case 'date':
        default:
          aValue = new Date(a.creditedOn)
          bValue = new Date(b.creditedOn)
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
    const categoryTotals = {}
    filteredIncomes.forEach((inc) => {
      categoryTotals[inc.category] = (categoryTotals[inc.category] || 0) + inc.amount
    })

    const pieData = {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: COLORS.slice(0, Object.keys(categoryTotals).length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    }

    setCategoryData(pieData)

    const sortedIncomes = [...filteredIncomes].sort(
      (a, b) => new Date(a.creditedOn) - new Date(b.creditedOn)
    )

    const groupedByDate = {}
    sortedIncomes.forEach((inc) => {
      const date = new Date(inc.creditedOn).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
      groupedByDate[date] = (groupedByDate[date] || 0) + inc.amount
    })

    const lineData = {
      labels: Object.keys(groupedByDate),
      datasets: [{
        label: 'Income Received',
        data: Object.values(groupedByDate),
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

    setTimelineData(lineData)

    if (stats?.monthlyTrend) {
      const trend = stats.monthlyTrend
      const groupedByMonth = {}

      trend.forEach(item => {
        if (!groupedByMonth[item.month]) {
          groupedByMonth[item.month] = 0
        }
        groupedByMonth[item.month] += item.amount
      })

      const barData = {
        labels: Object.keys(groupedByMonth).map(month => {
          const [year, monthNum] = month.split('-')
          return new Date(year, monthNum - 1).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric'
          })
        }),
        datasets: [{
          label: 'Monthly Income',
          data: Object.values(groupedByMonth),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 1
        }]
      }

      setMonthlyTrendData(barData)
    }
  }

  const handleAddIncome = async (e) => {
    e.preventDefault()
    if (!formData.amount || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        desc: formData.description,
        creditedOn: new Date(formData.creditedOn),
        source: formData.source,
        isRecurring: formData.isRecurring,
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
        status: formData.status,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      }

      const response = await api.post('/income/add', payload)
      if (response.success) {
        toast.success('Income added successfully!')
        setFormData({
          amount: '',
          category: 'Salary',
          description: '',
          creditedOn: new Date().toISOString().split('T')[0],
          source: '',
          isRecurring: false,
          recurrenceType: 'Monthly',
          status: 'Received',
          tags: ''
        })
        setShowAddModal(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add income')
    }
  }

  const handleBulkAdd = async (e) => {
    e.preventDefault()

    const validIncomes = bulkFormData.filter(item =>
      item.amount && item.category && item.creditedOn
    )

    if (validIncomes.length === 0) {
      toast.error('Please add at least one valid income entry')
      return
    }

    if (validIncomes.length === 1) {
      const singleIncome = validIncomes[0]
      try {
        const payload = {
          amount: parseFloat(singleIncome.amount),
          category: singleIncome.category,
          desc: singleIncome.description,
          creditedOn: new Date(singleIncome.creditedOn),
          source: singleIncome.source,
          isRecurring: singleIncome.isRecurring,
          recurrenceType: singleIncome.isRecurring ? singleIncome.recurrenceType : null,
          status: 'Received',
          tags: []
        }

        const response = await api.post('/income/add', payload)

        if (response.success) {
          toast.success('Income added successfully!')
          setBulkFormData([{
            amount: '',
            category: 'Salary',
            description: '',
            creditedOn: new Date().toISOString().split('T')[0],
            source: '',
            isRecurring: false
          }])
          setShowBulkAdd(false)
          fetchAllData()
        }
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to add income')
      }
      return
    }

    try {
      const response = await api.post('/income/bulk-add', {
        incomes: validIncomes.map(item => ({
          amount: parseFloat(item.amount),
          category: item.category,
          desc: item.description,
          creditedOn: new Date(item.creditedOn),
          source: item.source,
          isRecurring: item.isRecurring,
          recurrenceType: item.isRecurring ? item.recurrenceType : null,
          status: 'Received'
        }))
      })

      if (response.success) {
        toast.success(`${response.data.count} incomes added successfully!`)
        setBulkFormData([{
          amount: '',
          category: 'Salary',
          description: '',
          creditedOn: new Date().toISOString().split('T')[0],
          source: '',
          isRecurring: false
        }])
        setShowBulkAdd(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add incomes')
    }
  }

  const handleEditIncome = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        amount: parseFloat(editFormData.amount),
        category: editFormData.category,
        desc: editFormData.description,
        creditedOn: new Date(editFormData.creditedOn),
        source: editFormData.source,
        isRecurring: editFormData.isRecurring,
        recurrenceType: editFormData.isRecurring ? editFormData.recurrenceType : null,
        status: editFormData.status
      }

      const response = await api.put(`/income/update/${editFormData.id}`, payload)
      if (response.success) {
        toast.success('Income updated successfully!')
        setShowEditModal(false)
        fetchAllData()
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update income')
    }
  }

  const handleDeleteIncome = async (incomeId) => {
    if (!window.confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      const response = await api.delete(`/income/delete/${incomeId}`)
      if (response.success) {
        toast.success('Income deleted successfully!')
        fetchAllData()
      }
    } catch (error) {
      toast.error('Failed to delete income')
    }
  }

  const fetchAiInsights = async () => {
    try {
      const response = await api.get('/income/ai-insights')
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

  const openEditForm = (income) => {
    setEditFormData({
      id: income._id,
      amount: income.amount,
      category: income.category,
      description: income.desc || '',
      creditedOn: new Date(income.creditedOn).toISOString().split('T')[0],
      source: income.source || '',
      isRecurring: income.isRecurring || false,
      recurrenceType: income.recurrenceType || 'Monthly',
      status: income.status || 'Received'
    })
    setShowEditModal(true)
  }

  const addBulkRow = () => {
    setBulkFormData([...bulkFormData, {
      amount: '',
      category: 'Salary',
      description: '',
      creditedOn: new Date().toISOString().split('T')[0],
      source: '',
      isRecurring: false
    }])
  }

  const removeBulkRow = (index) => {
    if (bulkFormData.length > 1) {
      setBulkFormData(bulkFormData.filter((_, i) => i !== index))
    }
  }

  const exportData = () => {
    const dataStr = JSON.stringify(filteredIncomes, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = `income-data-${new Date().toISOString().split('T')[0]}.json`

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
      category: 'Salary',
      description: '',
      creditedOn: new Date().toISOString().split('T')[0],
      source: '',
      isRecurring: false,
      recurrenceType: 'Monthly',
      status: 'Received',
      tags: ''
    })
    setShowAddModal(true)
  }

  const openBulkAddModal = () => {
    setBulkFormData([{
      amount: '',
      category: 'Salary',
      description: '',
      creditedOn: new Date().toISOString().split('T')[0],
      source: '',
      isRecurring: false
    }])
    setShowBulkAdd(true)
  }

  const paginatedIncomes = getPaginatedIncomes()

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
            {/* Header */}
            <div className='flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>Income Management</h1>
                <p className='text-gray-600 mt-1'>Track, analyze and optimize your income sources</p>
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
                  Add Income
                </button>
              </div>
            </div>

            {/* Add Income Modal */}
            {showAddModal && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowAddModal(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>Add New Income</h3>
                        <button
                          type='button'
                          onClick={() => setShowAddModal(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleAddIncome} className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Amount *</label>
                            <input
                              type='number'
                              name='amount'
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder='Enter amount'
                              step='0.01'
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Category *</label>
                            <select name='category' value={formData.category} onChange={handleChange} className='input-field'>
                              {INCOME_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Date *</label>
                            <input
                              type='date'
                              name='creditedOn'
                              value={formData.creditedOn}
                              onChange={handleChange}
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Source</label>
                            <input
                              type='text'
                              name='source'
                              value={formData.source}
                              onChange={handleChange}
                              placeholder='e.g., Company Name'
                              className='input-field'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                            <input
                              type='text'
                              name='description'
                              value={formData.description}
                              onChange={handleChange}
                              placeholder='Optional notes'
                              className='input-field'
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Tags (comma separated)</label>
                            <input
                              type='text'
                              name='tags'
                              value={formData.tags}
                              onChange={handleChange}
                              placeholder='e.g., bonus, project, contract'
                              className='input-field'
                            />
                          </div>
                        </div>

                        <div className='space-y-4'>
                          <div className='flex items-center gap-4'>
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
                                Recurring Income
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
                          <button type='submit' className='btn-primary flex-1'>Add Income</button>
                          <button type='button' onClick={() => setShowAddModal(false)} className='btn-secondary'>Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Income Modal */}
            {showEditModal && (
              <div className='fixed inset-0 z-50 overflow-y-auto'>
                <div className='flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0'>
                  <div className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75' onClick={() => setShowEditModal(false)} />

                  <span className='hidden sm:inline-block sm:align-middle sm:h-screen'>&#8203;</span>

                  <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
                    <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                      <div className='flex justify-between items-center mb-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>Edit Income</h3>
                        <button
                          type='button'
                          onClick={() => setShowEditModal(false)}
                          className='text-gray-400 hover:text-gray-600'
                        >
                          <FaTimes />
                        </button>
                      </div>

                      <form onSubmit={handleEditIncome} className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Amount *</label>
                            <input
                              type='number'
                              name='amount'
                              value={editFormData.amount}
                              onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                              placeholder='Enter amount'
                              step='0.01'
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Category *</label>
                            <select
                              name='category'
                              value={editFormData.category}
                              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                              className='input-field'
                            >
                              {INCOME_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Date *</label>
                            <input
                              type='date'
                              name='creditedOn'
                              value={editFormData.creditedOn}
                              onChange={(e) => setEditFormData({ ...editFormData, creditedOn: e.target.value })}
                              className='input-field'
                              required
                            />
                          </div>
                          <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Source</label>
                            <input
                              type='text'
                              name='source'
                              value={editFormData.source}
                              onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value })}
                              placeholder='e.g., Company Name'
                              className='input-field'
                            />
                          </div>
                          <div className='md:col-span-2'>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>Description</label>
                            <textarea
                              name='description'
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                              placeholder='Optional notes'
                              className='input-field'
                              rows='2'
                            />
                          </div>
                        </div>

                        <div className='flex items-center gap-4'>
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
                              Recurring Income
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
                          <button type='submit' className='btn-primary flex-1'>Update Income</button>
                          <button type='button' onClick={() => setShowEditModal(false)} className='btn-secondary'>Cancel</button>
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
                          Bulk Add Incomes {bulkFormData.length > 1 && `(${bulkFormData.length} rows)`}
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
                                <h4 className='font-medium text-gray-700'>Income #{index + 1}</h4>
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
                                    {INCOME_CATEGORIES.map((cat) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Date *</label>
                                  <input
                                    type='date'
                                    value={item.creditedOn}
                                    onChange={(e) => handleBulkFormChange(index, 'creditedOn', e.target.value)}
                                    className='input-field text-sm'
                                    required
                                  />
                                </div>
                                <div>
                                  <label className='block text-sm font-medium text-gray-700 mb-1'>Source</label>
                                  <input
                                    type='text'
                                    value={item.source}
                                    onChange={(e) => handleBulkFormChange(index, 'source', e.target.value)}
                                    placeholder='Source'
                                    className='input-field text-sm'
                                  />
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
                                <div className='flex items-center'>
                                  <input
                                    type='checkbox'
                                    checked={item.isRecurring}
                                    onChange={(e) => handleBulkFormChange(index, 'isRecurring', e.target.checked)}
                                    className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                    id={`isRecurring-${index}`}
                                  />
                                  <label htmlFor={`isRecurring-${index}`} className='ml-2 text-sm text-gray-700'>
                                    Recurring Income
                                  </label>
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
                              {bulkFormData.length === 1 ? 'Add Income' : `Add ${bulkFormData.length} Incomes`}
                            </button>
                          </div>
                        </div>
                        <p className='text-xs text-gray-500 mt-2'>
                          {bulkFormData.length === 1
                            ? 'Adding only one income? It will use the regular add endpoint.'
                            : 'Multiple incomes detected. They will be added using bulk-add endpoint.'}
                        </p>
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
                        <h3 className='text-lg font-semibold text-gray-900'>AI Income Insights</h3>
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
                            {/* Predictions */}
                            {aiInsights?.prediction && (
                              <div className='bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200'>
                                <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                                  <FaLightbulb className='text-yellow-500' />
                                  Predictions
                                </h4>
                                <div className='grid grid-cols-2 gap-3'>
                                  <div>
                                    <p className='text-xs text-gray-600 font-medium'>Expected Next Month</p>
                                    <p className='text-lg font-bold text-green-700 mt-1'>
                                      {formatCurrency(aiInsights.prediction.expectedNextMonth, user?.currency)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className='text-xs text-gray-600 font-medium'>Guaranteed Recurring</p>
                                    <p className='text-lg font-bold text-blue-700 mt-1'>
                                      {formatCurrency(aiInsights.prediction.guaranteedRecurring, user?.currency)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* insights */}
                            {aiInsights?.analysis?.insights && aiInsights?.analysis?.insights.length > 0 && (
                              <div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200'>
                                <h4 className='font-semibold text-gray-900 mb-3'>Insights</h4>
                                <ul className='space-y-2'>
                                  {aiInsights.analysis.insights.map((insights, index) => (
                                    <li key={index} className='flex items-start gap-2 text-sm'>
                                      <FaLightbulb className='w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0' />
                                      <span className='text-gray-700'>{insights}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggestions */}
                            {aiInsights?.analysis?.suggestions && aiInsights.analysis.suggestions.length > 0 && (
                              <div className='bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200'>
                                <h4 className='font-semibold text-gray-900 mb-3'>Suggestions</h4>
                                <ul className='space-y-2'>
                                  {aiInsights.analysis.suggestions.map((suggestion, index) => (
                                    <li key={index} className='flex items-start gap-2 text-sm'>
                                      <FaLightbulb className='w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0' />
                                      <span className='text-gray-700'>{suggestion}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommendation */}
                            {aiInsights?.prediction?.suggestion && (
                              <div className='bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200'>
                                <h4 className='font-semibold text-gray-900 mb-2'>AI Recommendation</h4>
                                <p className='text-gray-700'>{aiInsights.prediction.suggestion}</p>
                              </div>
                            )}
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
                        <h3 className='text-lg font-semibold text-gray-900'>Detailed Income Statistics</h3>
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
                              <p className='text-2xl font-bold text-green-600'>
                                {formatCurrency(stats.summary?.totalAmount || 0, user?.currency)}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Average Income</p>
                              <p className='text-2xl font-bold text-blue-600'>
                                {formatCurrency(stats.summary?.averageAmount || 0, user?.currency)}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Total Transactions</p>
                              <p className='text-2xl font-bold text-purple-600'>
                                {stats.summary?.count || 0}
                              </p>
                            </div>
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <p className='text-sm text-gray-600'>Recurring</p>
                              <p className='text-2xl font-bold text-yellow-600'>
                                {stats.summary?.recurringCount || 0}
                              </p>
                            </div>
                          </div>

                          {/* Category Breakdown */}
                          {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 && (
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <h3 className='font-semibold text-gray-900 mb-4'>Category Breakdown</h3>
                              <div className='space-y-3'>
                                {Object.entries(stats.categoryBreakdown).map(([category, data]) => (
                                  <div key={category} className='flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <div className='w-3 h-3 rounded-full' style={{ backgroundColor: COLORS[Object.keys(stats.categoryBreakdown).indexOf(category) % COLORS.length] }} />
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
                          {monthlyTrendData && (
                            <div className='bg-white p-4 rounded-lg border shadow-sm'>
                              <h3 className='font-semibold text-gray-900 mb-4'>6-Month Trend</h3>
                              <div className='h-64'>
                                <Bar
                                  data={monthlyTrendData}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { display: false }
                                    },
                                    scales: {
                                      y: { beginAtZero: true }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className='text-center py-8'>
                          <FaExclamationTriangle className='w-12 h-12 text-yellow-500 mx-auto mb-4' />
                          <p className='text-gray-600'>Statistics are not available</p>
                          <p className='text-gray-500 text-sm mt-2'>Try adding some income data first</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Cards */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
              <div className='card'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-gray-600 text-sm'>Total Income</p>
                    <p className='text-2xl font-bold text-green-600 mt-1'>{formatCurrency(totalIncome, user?.currency)}</p>
                  </div>
                  <FaMoneyBillWave className='w-10 h-10 text-green-400' />
                </div>
              </div>
              <div className='card'>
                <div>
                  <p className='text-gray-600 text-sm'>Transactions</p>
                  <p className='text-2xl font-bold text-blue-600 mt-1'>{filteredIncomes.length}</p>
                </div>
              </div>
              <div className='card'>
                <div>
                  <p className='text-gray-600 text-sm'>Average Income</p>
                  <p className='text-2xl font-bold text-purple-600 mt-1'>
                    {formatCurrency(filteredIncomes.length > 0 ? totalIncome / filteredIncomes.length : 0, user?.currency)}
                  </p>
                </div>
              </div>
              <div className='card'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Period</label>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className='input-field'>
                    <option value='all'>All Time</option>
                    <option value='month'>This Month</option>
                    <option value='quarter'>This Quarter</option>
                    <option value='year'>This Year</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className='input-field'>
                  <option value='all'>All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>{cat.name} ({cat.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Source</label>
                <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className='input-field'>
                  <option value='all'>All Sources</option>
                  {sources.map((src) => (
                    <option key={src.name} value={src.name}>{src.name} ({src.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Filter by Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className='input-field'>
                  <option value='all'>All Status</option>
                  {STATUS_TYPES.map((status) => (
                    <option key={status} value={status}>{status}</option>
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
                  <FaChartPie /> Income by Category
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
                    <p className='text-gray-500 text-center py-10'>No income data available</p>
                    )}
              </div>

              <div className='card'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaChartLine /> Income Timeline
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
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    </div>
                    )
                  : (
                    <p className='text-gray-500 text-center py-10'>No income data available</p>
                    )}
              </div>
            </div>

            {/* Recurring Analysis Section */}
            {recurringAnalysis && (
              <div className='card mb-8'>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <FaSync /> Recurring Income Analysis
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                    <p className='text-sm text-blue-700'>Monthly Recurring</p>
                    <p className='text-2xl font-bold text-blue-700 mt-1'>
                      {formatCurrency(recurringAnalysis.totalMonthlyAmount, user?.currency)}
                    </p>
                    <p className='text-xs text-blue-600 mt-1'>{recurringAnalysis.monthlyRecurring} sources</p>
                  </div>
                  <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
                    <p className='text-sm text-green-700'>Weekly Recurring</p>
                    <p className='text-2xl font-bold text-green-700 mt-1'>
                      {formatCurrency(recurringAnalysis.totalWeeklyAmount, user?.currency)}
                    </p>
                    <p className='text-xs text-green-600 mt-1'>{recurringAnalysis.weeklyRecurring} sources</p>
                  </div>
                  <div className='bg-purple-50 p-4 rounded-lg border border-purple-200'>
                    <p className='text-sm text-purple-700'>Predicted Monthly</p>
                    <p className='text-2xl font-bold text-purple-700 mt-1'>
                      {formatCurrency(recurringAnalysis.predictedMonthlyIncome, user?.currency)}
                    </p>
                    <p className='text-xs text-purple-600 mt-1'>Reliability: {recurringAnalysis.reliability}</p>
                  </div>
                </div>
                {recurringAnalysis.suggestions && recurringAnalysis.suggestions.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='text-sm font-semibold text-gray-700 mb-2'>Suggestions:</h4>
                    <ul className='space-y-1'>
                      {recurringAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className='flex items-start gap-2 text-sm text-gray-600'>
                          <FaLightbulb className='w-4 h-4 text-yellow-500 mt-0.5' />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recent Transactions */}
            <div className='card'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-900'>Recent Transactions</h3>
                <div className='text-sm text-gray-600'>
                  Showing {paginatedIncomes.length} of {pagination.totalCount} transactions
                </div>
              </div>

              {paginatedIncomes.length > 0
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
                              Source
                            </th>
                            <th className='text-left py-3 px-4 text-sm font-semibold text-gray-700'>
                              Description
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
                          {paginatedIncomes.map((income) => (
                            <tr key={income._id} className='border-b border-gray-100 hover:bg-gray-50 transition'>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                <div className='flex flex-col'>
                                  <span>{formatDate(income.creditedOn)}</span>
                                  {income.isRecurring && (
                                    <span className='text-xs text-yellow-600 mt-1'>
                                      <FaSync className='inline w-3 h-3 mr-1' />
                                      {income.recurrenceType}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className='py-3 px-4 text-sm'>
                                <span className='px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium'>
                                  {income.category}
                                </span>
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600'>
                                {income.source || '-'}
                              </td>
                              <td className='py-3 px-4 text-sm text-gray-600 max-w-xs truncate'>
                                {income.desc || '-'}
                              </td>
                              <td className='py-3 px-4 text-sm'>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  income.status === 'Received'
                                    ? 'bg-green-100 text-green-700'
                                    : income.status === 'Pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                                >
                                  {income.status}
                                </span>
                              </td>
                              <td className='py-3 px-4 text-sm font-semibold text-green-600 text-right'>
                                +{formatCurrency(income.amount, user?.currency)}
                              </td>
                              <td className='py-3 px-4 text-sm text-right space-x-2'>
                                <div className='flex justify-end gap-2'>
                                  <button
                                    onClick={() => openEditForm(income)}
                                    className='text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1'
                                  >
                                    <FaEdit className='w-3 h-3' /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteIncome(income._id)}
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
                    {pagination.totalPages > 1 && (
                      <div className='flex justify-between items-center mt-6 pt-6 border-t border-gray-200'>
                        <div className='text-sm text-gray-600'>
                          Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className={`px-3 py-1 rounded text-sm ${
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
                            className={`px-3 py-1 rounded text-sm ${
                              pagination.page >= pagination.totalPages
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
                    <p className='text-gray-500 text-lg'>No income transactions found</p>
                    <p className='text-gray-400 text-sm mt-2'>Try adjusting your filters or add new income records</p>
                    <button
                      onClick={openAddModal}
                      className='btn-primary mt-4'
                    >
                      Add Your First Income
                    </button>
                  </div>
                  )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default IncomePage
