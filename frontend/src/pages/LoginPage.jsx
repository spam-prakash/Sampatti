import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import LoginForm from '../components/auth/LoginForm'
import Loader from '../components/common/Loader'

const LoginPage = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='inline-block p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg'>
            <Loader size='lg' />
            <p className='mt-4 text-gray-600 font-medium animate-pulse'>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (user) {
    return <Navigate to={user.onboardingComplete ? '/dashboard' : '/onboarding'} replace />
  }

  return (
    <AuthLayout
      title='Welcome back'
      subtitle='Sign in to your account to continue'
      type='login'
    >
      <LoginForm />
    </AuthLayout>
  )
};

export default LoginPage
