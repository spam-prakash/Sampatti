import React from 'react'
import { Link } from 'react-router-dom'
import {
  FaBullseye,
  FaCheckCircle,
  FaCalendarAlt,
  FaPlusCircle,
  FaRunning,
  FaChevronRight
} from 'react-icons/fa'
import { formatCurrency, formatDate } from '../../utils/helpers'

const GoalsCard = ({ goals }) => {
  const sampleGoals = [
    {
      id: 1,
      title: 'Emergency Fund',
      targetAmount: 100000,
      currentAmount: 45000,
      deadline: '2024-06-30',
      category: 'Emergency',
      progress: 45,
      status: 'active'
    },
    {
      id: 2,
      title: 'New Laptop',
      targetAmount: 75000,
      currentAmount: 60000,
      deadline: '2024-03-15',
      category: 'Electronics',
      progress: 80,
      status: 'active'
    },
    {
      id: 3,
      title: 'Vacation Trip',
      targetAmount: 150000,
      currentAmount: 150000,
      deadline: '2023-12-31',
      category: 'Travel',
      progress: 100,
      status: 'completed'
    }
  ]

  const displayedGoals = goals?.length > 0 ? goals : sampleGoals

  const getStatusStyles = (status, progress) => {
    if (status === 'completed' || progress >= 100) return 'text-green-600 bg-green-50 bar-green'
    if (progress >= 80) return 'text-blue-600 bg-blue-50 bar-blue'
    if (progress >= 50) return 'text-yellow-600 bg-yellow-50 bar-yellow'
    return 'text-rose-600 bg-rose-50 bar-rose'
  }

  return (
    <div className='bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='p-2 bg-purple-50 rounded-lg'>
            <FaBullseye className='w-5 h-5 text-purple-600' />
          </div>
          <h3 className='text-base md:text-lg font-bold text-gray-900'>Financial Goals</h3>
        </div>
        <Link
          to='/dashboard/goals/new'
          className='flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700 transition-all active:scale-95'
        >
          <FaPlusCircle />
          <span className='hidden sm:inline'>New Goal</span>
        </Link>
      </div>

      <div className='space-y-4'>
        {displayedGoals.map((goal) => {
          const statusClass = getStatusStyles(goal.status, goal.progress)
          const isComplete = goal.status === 'completed' || goal.progress >= 100

          return (
            <div
              key={goal.id}
              className='group p-4 border border-gray-100 rounded-xl hover:border-purple-100 hover:bg-purple-50/30 transition-all cursor-pointer'
            >
              <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1.5'>
                    <h4 className='font-bold text-gray-900 text-sm md:text-base'>{goal.title}</h4>
                    {isComplete && <FaCheckCircle className='text-green-500 w-4 h-4' />}
                  </div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${statusClass.split(' bar-')[0]}`}>
                      {isComplete ? 'Goal Met' : `${goal.progress}%`}
                    </span>
                    <span className='text-[11px] font-bold text-gray-400 uppercase tracking-widest'>{goal.category}</span>
                  </div>
                </div>

                <div className='sm:text-right'>
                  <div className='text-sm md:text-base font-black text-gray-900'>
                    {formatCurrency(goal.currentAmount)}
                    <span className='text-gray-400 font-medium text-xs mx-1'>/</span>
                    <span className='text-gray-500 text-xs md:text-sm font-medium'>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  {!isComplete && (
                    <div className='text-[11px] font-bold text-purple-600 mt-0.5'>
                      {formatCurrency(goal.targetAmount - goal.currentAmount)} to go
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className='relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-3'>
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    statusClass.includes('bar-green')
? 'bg-green-500'
                    : statusClass.includes('bar-blue')
? 'bg-blue-500'
                    : statusClass.includes('bar-yellow') ? 'bg-yellow-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress, 100)}%` }}
                />
              </div>

              <div className='flex items-center justify-between text-[11px] md:text-xs font-bold text-gray-400 uppercase tracking-tight'>
                <div className='flex items-center gap-1.5'>
                  <FaCalendarAlt className='text-gray-300' />
                  <span>Target: {formatDate(goal.deadline)}</span>
                </div>
                {!isComplete && (
                  <div className='flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded'>
                    <FaRunning />
                    <span>On track</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {displayedGoals.length === 0
? (
        <div className='text-center py-10'>
          <div className='w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4'>
            <FaBullseye className='w-8 h-8 text-gray-300' />
          </div>
          <p className='text-gray-900 font-bold'>No goals set yet</p>
          <p className='text-xs text-gray-500 mt-1 max-w-[200px] mx-auto'>
            Set your first financial goal to start your journey!
          </p>
          <button className='mt-6 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-100 active:scale-95 transition-all'>
            Create Goal
          </button>
        </div>
      )
: (
        <div className='mt-6'>
          <Link
            to='/dashboard/goals'
            className='w-full py-3 border border-gray-100 rounded-xl text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-50 hover:text-purple-600 transition-all flex items-center justify-center gap-2'
          >
            All Goals
            <FaChevronRight className='w-2 h-2' />
          </Link>
        </div>
      )}
    </div>
  )
}

export default GoalsCard
