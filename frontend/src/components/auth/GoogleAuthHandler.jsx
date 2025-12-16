import React, { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import Loader from '../common/Loader'

const GoogleAuthHandler = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading } = useAuth()

  useEffect(() => {
    const processGoogleAuth = async () => {
      const token = searchParams.get('token')
      const userParam = searchParams.get('user')
      const error = searchParams.get('error')

      if (error) {
        toast.error(`Google login failed: ${decodeURIComponent(error)}`)
        navigate('/login', { replace: true })
        return
      }

      if (token && userParam) {
        try {
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(userParam))

          // Store in localStorage
          localStorage.setItem('authToken', token)
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('authType', 'google')

          toast.success('Google login successful!')

          // Clean URL
          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)

          // Navigate based on user state
          setTimeout(() => {
            if (userData.onboardingComplete) {
              navigate('/dashboard', { replace: true })
            } else {
              navigate('/onboarding', { replace: true })
            }
          }, 1000)
        } catch (error) {
          console.error('Failed to process Google auth:', error)
          toast.error('Failed to process Google login')
          navigate('/login', { replace: true })
        }
      } else {
        // No auth data found, redirect to login
        navigate('/login', { replace: true })
      }
    }

    if (!loading) {
      processGoogleAuth()
    }
  }, [searchParams, navigate, loading])

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4'>
      <div className='text-center max-w-md'>
        <div className='w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse'>
          <div className='w-12 h-12 bg-white rounded-full flex items-center justify-center'>
            <div className='text-2xl'>✓</div>
          </div>
        </div>
        <h2 className='text-2xl font-bold text-gray-900 mb-3'>Completing Google Sign In</h2>
        <p className='text-gray-600 mb-8'>Redirecting you to your dashboard...</p>
        <Loader size='lg' />
        <p className='text-gray-500 text-sm mt-6 animate-pulse'>
          Please wait a moment...
        </p>
      </div>
    </div>
  )
}

export default GoogleAuthHandler
