import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/authService'
import toast from 'react-hot-toast'
import Loader from '../components/common/Loader'
import Header from '../components/dashboard/Header'
import Sidebar from '../components/dashboard/Sidebar'
import { FaUser, FaEnvelope, FaPhone, FaMoneyBillWave, FaChartLine, FaGlobe, FaSave, FaEdit, FaCamera } from 'react-icons/fa'
import { INCOME_SOURCES, CURRENCIES } from '../utils/constants'
import SampattiBot from '../components/dashboard/SampattiBot'

const ProfilePage = () => {
  const { user, updateUser } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    primaryMOI: '',
    monthlyIncome: '',
    currency: 'INR',
    savingsTarget: 20
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        primaryMOI: user.primaryMOI || '',
        monthlyIncome: user.monthlyIncome || '',
        currency: user.currency || 'INR',
        savingsTarget: user.savingsTarget || 20
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error('Name is required')
    setLoading(true)
    try {
      const response = await authService.updateProfile(formData)
      if (response.success) {
        updateUser(response.user)
        setEditing(false)
        toast.success('Profile updated!')
      }
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <div className='min-h-screen flex items-center justify-center'><Loader size='lg' /></div>

  return (
    <div className='flex h-screen bg-gray-50 overflow-hidden'>
     <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
     <div className='flex-1 flex flex-col min-w-0 relative overflow-y-auto'>
        <Header onMenuClick={toggleSidebar} />
        <main className='flex-1 p-4 md:p-8'>
          <div className='max-w-5xl mx-auto'>

            {/* Profile Hero Header */}
            <div className='relative mb-8 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm overflow-hidden'>
              <div className='absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-20 -mt-20 opacity-50 transition-all' />

              <div className='relative flex flex-col md:flex-row items-center gap-6'>
                <div className='relative group'>
                  <div className='w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200'>
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  {editing && (
                    <button className='absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md border border-gray-100 text-blue-600 hover:text-blue-700'>
                      <FaCamera size={14} />
                    </button>
                  )}
                </div>

                <div className='text-center md:text-left flex-1'>
                  <h1 className='text-2xl font-bold text-gray-900'>{user.name}</h1>
                  <p className='text-gray-500'>{user.email}</p>
                  <div className='mt-2 inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider'>
                    Premium Member
                  </div>
                </div>

                <button
                  onClick={() => editing ? handleSave() : setEditing(true)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                    editing
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-green-100'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
                  } shadow-lg`}
                >
                  {loading ? <Loader size='sm' /> : editing ? <><FaSave /> Save</> : <><FaEdit /> Edit Profile</>}
                </button>
              </div>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Personal Info */}
              <div className='lg:col-span-2 space-y-8'>
                <div className='bg-white rounded-3xl p-8 border border-gray-100 shadow-sm'>
                  <h3 className='text-lg font-bold text-gray-900 mb-6'>Personal Details</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <ProfileInput label='Full Name' icon={<FaUser />} name='name' value={formData.name} editing={editing} onChange={handleChange} />
                    <ProfileInput label='Email' icon={<FaEnvelope />} name='email' value={formData.email} editing={false} />
                    <ProfileInput label='Phone Number' icon={<FaPhone />} name='phone' value={formData.phone} editing={editing} onChange={handleChange} type='tel' />
                  </div>
                </div>

                <div className='bg-white rounded-3xl p-8 border border-gray-100 shadow-sm'>
                  <h3 className='text-lg font-bold text-gray-900 mb-6'>Financial Settings</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label className='text-sm font-bold text-gray-700 flex items-center gap-2'><FaMoneyBillWave className='text-blue-500' /> Income Source</label>
                      <select name='primaryMOI' value={formData.primaryMOI} onChange={handleChange} disabled={!editing} className='w-full p-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:ring-2 focus:ring-blue-500/20 outline-none disabled:opacity-60 transition-all'>
                        {INCOME_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                    <ProfileInput label='Monthly Income' icon={<FaChartLine />} name='monthlyIncome' value={formData.monthlyIncome} editing={editing} onChange={handleChange} type='number' />
                  </div>
                </div>
              </div>

              {/* Sidebar Stats */}
              <div className='space-y-6'>
                <HealthScoreCard score={user?.financialHealthScore} />
                <div className='bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200'>
                  <h4 className='font-bold opacity-80 text-sm mb-1'>Current Balance</h4>
                  <p className='text-3xl font-black'>₹{user?.balance?.toLocaleString()}</p>
                  <div className='mt-4 pt-4 border-t border-white/10 flex justify-between items-center'>
                    <span className='text-xs opacity-70'>Savings Goal</span>
                    <span className='text-sm font-bold'>{user?.savingsTarget}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
     <SampattiBot />
   </div>
  )
}

// Reusable Input Component for Profile
const ProfileInput = ({ label, icon, value, name, editing, onChange, type = 'text' }) => (
  <div className='space-y-2'>
    <label className='text-sm font-bold text-gray-700 flex items-center gap-2'>
      <span className='text-blue-500'>{icon}</span> {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      disabled={!editing}
      className={`w-full p-3 rounded-xl border transition-all outline-none ${
        editing
          ? 'border-blue-100 bg-white focus:ring-4 focus:ring-blue-500/10'
          : 'border-transparent bg-gray-50/50 text-gray-500'
      }`}
    />
  </div>
)

const HealthScoreCard = ({ score = 0 }) => (
  <div className='bg-white rounded-3xl p-6 border border-gray-100 shadow-sm'>
    <h4 className='text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider'>Financial Health</h4>
    <div className='relative flex items-center justify-center py-4'>
      <svg className='w-32 h-32 transform -rotate-90'>
        <circle cx='64' cy='64' r='58' stroke='currentColor' strokeWidth='10' fill='transparent' className='text-gray-100' />
        <circle cx='64' cy='64' r='58' stroke='currentColor' strokeWidth='10' fill='transparent' strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * score) / 100} className='text-blue-600 transition-all duration-1000' />
      </svg>
      <div className='absolute flex flex-col items-center'>
        <span className='text-3xl font-black text-gray-900'>{score}</span>
        <span className='text-[10px] font-bold text-gray-400 uppercase'>Score</span>
      </div>
    </div>
    <p className='text-center text-xs text-gray-500 mt-2 font-medium'>Keep it above 80 for optimal growth!</p>
  </div>
)

export default ProfilePage
