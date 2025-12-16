import React from 'react'
import { Link } from 'react-router-dom'
import {
  FaBullseye,
  FaCheckCircle,
  FaCalendarAlt,
  FaPlusCircle,
  FaRunning
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

  const getStatusColor = (status, progress) => {
    if (status === 'completed' || progress >= 100) return 'text-green-600 bg-green-50'
    if (progress >= 80) return 'text-blue-600 bg-blue-50'
    if (progress >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className='card'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center'>
          <FaBullseye className='w-6 h-6 text-purple-600 mr-3' />
          <h3 className='text-lg font-semibold text-gray-900'>Financial Goals</h3>
        </div>
        <Link
          to='/dashboard/goals/new'
          className='flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium'
        >
          <FaPlusCircle className='w-4 h-4 mr-2' />
          New Goal
        </Link>
      </div>

      <div className='space-y-4'>
        {displayedGoals.map((goal) => (
          <div key={goal.id} className='p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors'>
            <div className='flex items-start justify-between mb-3'>
              <div>
                <h4 className='font-medium text-gray-900'>{goal.title}</h4>
                <div className='flex items-center mt-1'>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status, goal.progress)}`}>
                    {goal.status === 'completed' || goal.progress >= 100
                      ? 'Completed'
                      : `${goal.progress}% Complete`}
                  </span>
                  <span className='ml-2 text-xs text-gray-500'>{goal.category}</span>
                </div>
              </div>
              <div className='text-right'>
                <div className='font-semibold text-gray-900'>
                  {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                </div>
                <div className='text-sm text-gray-500'>
                  {formatCurrency(goal.targetAmount - goal.currentAmount)} remaining
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className='w-full bg-gray-200 rounded-full h-2 mb-3'>
              <div
                className='h-2 rounded-full bg-primary-600'
                style={{ width: `${Math.min(goal.progress, 100)}%` }}
              />
            </div>

            <div className='flex items-center justify-between text-sm text-gray-600'>
              <div className='flex items-center'>
                <FaCalendarAlt className='w-3 h-3 mr-1' />
                <span>Target: {formatDate(goal.deadline)}</span>
              </div>
              {goal.progress < 100 && (
                <div className='flex items-center'>
                  <FaRunning className='w-3 h-3 mr-1' />
                  <span>On track</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {displayedGoals.length === 0
        ? (
          <div className='text-center py-8'>
            <FaBullseye className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600'>No goals set yet.</p>
            <p className='text-sm text-gray-500 mt-1'>
              Set your first financial goal to stay motivated!
            </p>
            <button className='mt-4 btn-primary'>
              <FaPlusCircle className='w-4 h-4 mr-2' />
              Create Your First Goal
            </button>
          </div>
          )
        : (
          <div className='mt-6 pt-6 border-t border-gray-200'>
            <Link
              to='/dashboard/goals'
              className='text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center'
            >
              View all goals
              <svg className='w-4 h-4 ml-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            </Link>
          </div>
          )}
    </div>
  )
}

export default GoalsCard
