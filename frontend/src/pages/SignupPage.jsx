import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AuthLayout from '../components/auth/AuthLayout'
import SignupForm from '../components/auth/SignupForm'
import Loader from '../components/common/Loader'

const SignupPage = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4'>
        <div className='text-center'>
          <div className='inline-block p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg'>
            <Loader size='lg' />
            <p className='mt-4 text-gray-600 font-medium animate-pulse'>Preparing your journey...</p>
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
      title='Create your account'
      subtitle='Start your financial journey with Sampatti'
      type='signup'
    >
      <SignupForm />
    </AuthLayout>
  )
};

export default SignupPage
