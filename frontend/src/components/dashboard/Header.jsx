import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  FaBell,
  FaUserCircle,
  FaCog,
  FaSignOutAlt,
  FaChevronDown,
  FaBars
} from 'react-icons/fa'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  // Split name for the mobile "Hi, Name" greeting
  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <header className='sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-3'>
      <div className='flex items-center justify-between max-w-7xl mx-auto'>

        {/* Left Side: Menu Toggle (Mobile) + Greeting */}
        <div className='flex items-center gap-3'>
          {/* Mobile Menu Button - Assuming you'll have a Sidebar */}
          <button
            onClick={onMenuClick}
            className='p-2 -ml-2 text-gray-500 md:hidden hover:bg-gray-100 rounded-lg'
          >
            <FaBars className='w-5 h-5' />
          </button>

          <div className='flex flex-col'>
            <h1 className='text-base md:text-xl font-bold text-gray-900 leading-tight'>
              <span className='hidden md:inline'>Welcome back, </span>{firstName}!
            </h1>
            <p className='hidden md:block text-xs text-gray-500 font-medium'>
              Here's what's happening with your money today.
            </p>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className='flex items-center gap-2 md:gap-4'>

          {/* Notifications Panel */}
          <div className='relative'>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowDropdown(false)
              }}
              className='relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all'
              aria-label='Notifications'
            >
              <FaBell className='w-5 h-5' />
              <span className='absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full' />
            </button>

            {showNotifications && (
              <div className='absolute right-[-50px] md:right-0 mt-3 w-[calc(100vw-32px)] md:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
                <div className='p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50'>
                  <h3 className='font-bold text-gray-900 text-sm'>Notifications</h3>
                  <button className='text-[11px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-700'>
                    Clear all
                  </button>
                </div>
                <div className='max-h-[60vh] overflow-y-auto p-2 space-y-1'>
                  {/* Notification Item */}
                  <div className='p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100'>
                    <p className='text-sm text-gray-700 leading-snug'>
                      Your <strong>Emergency Fund</strong> is 45% complete! 🚀
                    </p>
                    <p className='text-[10px] text-gray-400 font-bold mt-1 uppercase'>2 hours ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className='relative'>
            <button
              onClick={() => {
                setShowDropdown(!showDropdown)
                setShowNotifications(false)
              }}
              className='flex items-center gap-2 p-1 md:pl-2 md:pr-1 md:py-1 hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-xl transition-all'
            >
              <div className='w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-100'>
                {user?.profilePic
? (
                  <img src={user.profilePic} alt='' className='w-full h-full rounded-full object-cover' />
                )
: firstName.charAt(0)}
              </div>
              <FaChevronDown className={`hidden md:block w-3 h-3 text-gray-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className='absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200'>
                <div className='p-4 border-b border-gray-50'>
                  <p className='text-sm font-bold text-gray-900 truncate'>{user?.name}</p>
                  <p className='text-xs text-gray-400 truncate'>{user?.email}</p>
                </div>
                <div className='p-2'>
                  <Link
                    to='/profile'
                    className='flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors'
                    onClick={() => setShowDropdown(false)}
                  >
                    <FaUserCircle className='text-lg' /> Profile
                  </Link>
                  <button
                    onClick={logout}
                    className='flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors'
                  >
                    <FaSignOutAlt className='text-lg' /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
