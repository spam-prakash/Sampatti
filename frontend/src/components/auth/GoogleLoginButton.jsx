import React from 'react'
import { FcGoogle } from 'react-icons/fc'
import { useAuth } from '../../contexts/AuthContext'

const GoogleLoginButton = ({ text = 'Continue with Google' }) => {
  const { initiateGoogleLogin } = useAuth()

  return (
    <button
      type='button'
      onClick={initiateGoogleLogin}
      className='w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
    >
      <FcGoogle className='w-5 h-5' />
      <span className='text-gray-700 font-medium text-sm sm:text-base'>{text}</span>
    </button>
  )
};

export default GoogleLoginButton
