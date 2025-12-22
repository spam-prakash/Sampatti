import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import Loader from '../components/common/Loader'

const LoginPage = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Loading State: Matches the dashboard aesthetic
  if (loading) {
    return (
      <div className='min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='inline-flex flex-col items-center p-8 bg-white rounded-3xl shadow-xl shadow-blue-100/50 border border-gray-100'>
            <Loader size='lg' color='text-blue-600' />
            <div className='mt-6 space-y-2'>
              <p className='text-gray-900 font-bold text-lg'>Authenticating</p>
              <p className='text-gray-400 text-sm animate-pulse'>Securely connecting to your vault...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Redirect Logic:
  // 1. Check if user exists
  // 2. Redirect based on onboarding status
  // 3. Optional: Redirect back to where they were trying to go (using location.state)
  if (user) {
    const from = location.state?.from?.pathname || (user.onboardingComplete ? '/dashboard' : '/onboarding')
    return <Navigate to={from} replace />
  }

  return (
    <AuthLayout
      title='Welcome back'
      subtitle='Sign in to manage your financial milestones'
      type='login'
    >
      <div className='mt-8'>
        <LoginForm />
      </div>
    </AuthLayout>
  )
}

export default LoginPage
