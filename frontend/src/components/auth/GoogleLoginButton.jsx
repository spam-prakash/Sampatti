import React from 'react'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../contexts/AuthContext'

const GoogleLoginButton = ({ text = 'Continue with Google' }) => {
  const { initiateGoogleLogin } = useAuth()

  return (
    <button
      type='button'
      onClick={initiateGoogleLogin}
      // Added flex-nowrap to keep icon and text on one line
      className='w-full flex items-center justify-center gap-3 py-3 md:py-3.5 px-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.01] md:hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap'
    >
      {/* shrink-0 ensures the icon stays perfectly circular/square */}
      <FcGoogle className='w-5 h-5 md:w-6 md:h-6 shrink-0' />

      <span className='text-gray-700 font-medium text-sm sm:text-base tracking-tight'>
        {text}
      </span>
    </button>
  )
}

export default GoogleLoginButton
