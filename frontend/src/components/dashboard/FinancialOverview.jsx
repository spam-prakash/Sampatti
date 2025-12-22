import React from 'react'
import {
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaMoneyBillWave,
  FaChartLine,
  FaPiggyBank
} from 'react-icons/fa'
import { formatCurrency } from '../../utils/helpers'

const FinancialOverview = ({ user, insights }) => {
  const stats = [
    {
      title: 'Current Balance',
      value: user?.balance || 0,
      icon: FaWallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12.5%',
      trend: 'up',
      positiveTrend: true // Up is good for balance
    },
    {
      title: 'Monthly Income',
      value: user?.monthlyIncome || 0,
      icon: FaMoneyBillWave,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5.2%',
      trend: 'up',
      positiveTrend: true // Up is good for income
    },
    {
      title: 'Monthly Expenses',
      value: insights?.totalSpent || 0,
      icon: FaChartLine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-3.1%',
      trend: 'down',
      positiveTrend: true // Down is good for expenses
    },
    {
      title: 'Total Savings',
      value: user?.totalSavings || 0,
      icon: FaPiggyBank,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8.7%',
      trend: 'up',
      positiveTrend: true
    },
  ]

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8'>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98] sm:active:scale-100'
        >
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <p className='text-xs md:text-sm font-semibold text-gray-500 uppercase tracking-wider'>
                {stat.title}
              </p>
              <h3 className='text-xl md:text-2xl font-bold text-gray-900 mt-1 truncate'>
                {formatCurrency(stat.value, user?.currency)}
              </h3>

              <div className='flex items-center mt-3'>
                <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                  stat.trend === 'up'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
                >
                  {stat.trend === 'up'
? (
                    <FaArrowUp className='w-2.5 h-2.5 mr-1' />
                  )
: (
                    <FaArrowDown className='w-2.5 h-2.5 mr-1' />
                  )}
                  {stat.change}
                </div>
                <span className='text-[10px] md:text-xs text-gray-400 ml-2 font-medium'>
                  vs last month
                </span>
              </div>
            </div>

            <div className={`${stat.bgColor} p-3 rounded-xl ml-4 shrink-0 shadow-inner`}>
              <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
};

export default FinancialOverview
