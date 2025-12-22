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
          const userData = JSON.parse(decodeURIComponent(userParam))

          localStorage.setItem('authToken', token)
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('authType', 'google')

          toast.success('Google login successful!')

          const cleanUrl = window.location.pathname
          window.history.replaceState({}, document.title, cleanUrl)

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
        navigate('/login', { replace: true })
      }
    }

    if (!loading) {
      processGoogleAuth()
    }
  }, [searchParams, navigate, loading])

  return (
    /* Use 100dvh for better mobile browser support */
    <div className='min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 px-6 py-8'>
      <div className='text-center w-full max-w-sm md:max-w-md'>

        {/* Animated Icon Container */}
        <div className='w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse'>
          <div className='w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center'>
            <div className='text-xl md:text-2xl font-bold text-blue-600'>✓</div>
          </div>
        </div>

        {/* Text Content */}
        <h2 className='text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 px-2'>
          Completing Google Sign In
        </h2>
        <p className='text-gray-600 text-sm md:text-base mb-8'>
          Redirecting you to your dashboard...
        </p>

        {/* Loader Section */}
        <div className='flex justify-center'>
          <Loader size='lg' />
        </div>

        {/* Footer Hint */}
        <p className='text-gray-400 text-xs md:text-sm mt-8 animate-pulse font-medium tracking-wide uppercase'>
          Please wait a moment...
        </p>
      </div>
    </div>
  )
}

export default GoogleAuthHandler
