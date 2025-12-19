import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaChartLine,
  FaPiggyBank,
  FaBullseye,
  FaCog,
  FaQuestionCircle,
  FaMoneyBillWave
} from 'react-icons/fa'
import { FcMoneyTransfer } from 'react-icons/fc'

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/income', icon: FaMoneyBillWave, label: 'Income' },
    { path: '/expense', icon: FaChartLine, label: 'Expenses' },
    { path: '/goals', icon: FaBullseye, label: 'Goals' }
  ]

  const bottomItems = [
    { path: '/profile', icon: FaCog, label: 'Settings' },
    // { path: '/help', icon: FaQuestionCircle, label: 'Help & Support' }
  ]

  return (
    <div className='hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200'>
      <div className='flex items-center h-16 px-6 border-b border-gray-200'>
        <div className='flex items-center'>
          <FcMoneyTransfer className='w-8 h-8' />
          <span className='ml-3 text-xl font-bold text-gray-900'>Sampatti</span>
        </div>
      </div>

      <div className='flex-1 flex flex-col pt-5 pb-4 overflow-y-auto'>
        <nav className='flex-1 px-4 space-y-1'>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon className='w-5 h-5 mr-3' />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className='mt-auto px-4 space-y-1'>
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <item.icon className='w-5 h-5 mr-3' />
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
