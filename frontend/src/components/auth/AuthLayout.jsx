import React from 'react'
import { Link } from 'react-router-dom'
import { FcMoneyTransfer } from 'react-icons/fc'
import { FaPiggyBank, FaChartLine, FaShieldAlt } from 'react-icons/fa'

const AuthLayout = ({ children, title, subtitle, type = 'login' }) => {
  const features = [
    { icon: <FaPiggyBank />, text: 'Smart Savings' },
    { icon: <FaChartLine />, text: 'Track Expenses' },
    { icon: <FaShieldAlt />, text: 'Bank-level Security' }
  ]

  const gradientClass = type === 'login'
    ? 'from-blue-50 via-indigo-50 to-purple-50'
    : 'from-emerald-50 via-teal-50 to-cyan-50'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientClass} flex flex-col lg:flex-row items-center justify-center p-4 md:p-6 lg:p-8`}>
      {/* Left side - Brand & Features */}
      <div className='w-full lg:w-1/2 max-w-lg mb-8 lg:mb-0 lg:mr-12 xl:mr-16'>
        <div className='text-center lg:text-left'>
          <div className='inline-flex items-center gap-3 mb-6'>
            <div className='w-14 h-14 bg-white rounded-2xl shadow-lg flex items-center justify-center'>
              <FcMoneyTransfer className='w-9 h-9' />
            </div>
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                Sampatti
              </h1>
              <p className='text-gray-600 font-medium'>Smart Financial Management</p>
            </div>
          </div>

          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight'>
            Take Control of Your <span className='text-blue-600'>Finances</span>
          </h2>
          <p className='text-gray-600 text-lg mb-8 max-w-md'>
            Join thousands who've transformed their financial health with our intuitive platform.
          </p>

          {/* Features */}
          <div className='space-y-4 mb-8'>
            {features.map((feature, index) => (
              <div key={index} className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600'>
                  {feature.icon}
                </div>
                <span className='text-gray-700 font-medium'>{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className='bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/50'>
            <p className='text-gray-700 italic mb-3'>
              "Sampatti helped me save 30% more in just 3 months. The insights are game-changing!"
            </p>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full' />
              <div>
                <p className='font-semibold text-gray-900'>Priya Sharma</p>
                <p className='text-sm text-gray-600'>Marketing Executive</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className='w-full max-w-md lg:max-w-lg'>
        <div className='bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50'>
          {/* Form Header */}
          <div className='mb-8'>
            <div className='inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center'>
                <FcMoneyTransfer className='w-6 h-6' />
              </div>
            </div>
            <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>{title}</h2>
            {subtitle && (
              <p className='text-gray-600 mt-2 text-sm md:text-base'>{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          <div className='mb-6'>
            {children}
          </div>

          {/* Footer Links */}
          <div className='pt-6 border-t border-gray-200'>
            <p className='text-gray-600 text-center text-sm'>
              {type === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Link
                to={type === 'login' ? '/signup' : '/login'}
                className='font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200'
              >
                {type === 'login' ? 'Sign up for free' : 'Sign in'}
              </Link>
            </p>
            <p className='text-xs text-gray-500 text-center mt-4'>
              By continuing, you agree to our{' '}
              <Link to='/terms' className='text-blue-500 hover:underline'>Terms</Link>
              {' '}and{' '}
              <Link to='/privacy' className='text-blue-500 hover:underline'>Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
