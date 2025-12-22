import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  FaTachometerAlt,
  FaChartLine,
  FaBullseye,
  FaCog,
  FaMoneyBillWave,
  FaTimes,
  FaUsers,
  FaProjectDiagram
} from 'react-icons/fa'
import { FcMoneyTransfer } from 'react-icons/fc'

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { path: '/dashboard', icon: FaTachometerAlt, label: 'Dashboard' },
    { path: '/income', icon: FaMoneyBillWave, label: 'Income' },
    { path: '/expense', icon: FaChartLine, label: 'Expenses' },
    { path: '/goals', icon: FaBullseye, label: 'Goals' }
  ]

  const bottomItems = [
    { path: '/about-developer', icon: FaUsers, label: 'About Developer' },
    { path: '/about-project', icon: FaProjectDiagram, label: 'About Project' },
    { path: '/profile', icon: FaCog, label: 'Settings' }
  ]

  const linkStyles = ({ isActive }) => `
    flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200 group
    ${isActive
      ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100/50'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
  `

  return (
    <>
      {/* 1. Mobile Backdrop: Higher Z-index (60) */}
      <div
        className={`fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] md:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={onClose}
      />

      {/* 2. Sidebar Container: Highest Z-index (70) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-white border-r border-gray-100
        flex flex-col h-full transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >

        {/* Logo & Close Button Header */}
        <div className='flex items-center justify-between h-20 px-6 shrink-0 border-b border-gray-50'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center'>
              <FcMoneyTransfer className='w-7 h-7' />
            </div>
            <span className='text-xl font-black text-gray-900 tracking-tight'>Sampatti</span>
          </div>

          {/* Close button: Fixed 'onClose' trigger */}
          <button
            type='button'
            onClick={(e) => {
              e.preventDefault()
              onClose()
            }}
            className='p-2 -mr-2 text-gray-400 hover:text-red-500 md:hidden transition-colors'
            aria-label='Close Sidebar'
          >
            <FaTimes className='w-6 h-6' />
          </button>
        </div>

        {/* Navigation Content */}
        <div className='flex-1 flex flex-col py-6 overflow-y-auto custom-scrollbar'>
          <nav className='px-4 space-y-1.5'>
            <p className='px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4'>Main Menu</p>
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end
                onClick={() => { if (window.innerWidth < 768) onClose() }}
                className={linkStyles}
              >
                <item.icon className='w-5 h-5 mr-3 transition-transform group-hover:scale-110' />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Bottom Nav */}
          <div className='px-4 mt-auto pt-6'>
            <p className='px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4'>Preferences</p>
            {bottomItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 768) onClose() }}
                className={linkStyles}
              >
                <item.icon className='w-5 h-5 mr-3 transition-transform group-hover:scale-110' />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
