import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa'
import Loader from '../common/Loader'
import GoogleLoginButton from './GoogleLoginButton'
import toast from 'react-hot-toast'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isValidPassword, setIsValidPassword] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for redirect message
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const message = queryParams.get('message')
    if (message) {
      toast.success(message)
      // Clean URL
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location])

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear errors for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Validate email in real-time
    if (name === 'identifier') {
      setIsValidEmail(value.includes('@') ? validateEmail(value) : value.length >= 3)
    }

    // Validate password in real-time
    if (name === 'password') {
      setIsValidPassword(value.length >= 5)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or username is required'
    } else if (formData.identifier.includes('@') && !validateEmail(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const result = await login(formData.identifier, formData.password, remember)
      
      if (result.success) {
        toast.success('Signed in successfully!')
        setTimeout(() => {
          navigate(result.requiresOnboarding ? '/onboarding' : '/dashboard')
        }, 500)
      } else {
        toast.error(result.error || 'Invalid credentials. Please try again.')
        // Clear password on error
        setFormData(prev => ({ ...prev, password: '' }))
      }
    } catch (error) {
      toast.error('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      {/* Email/Username Field */}
      <div className='space-y-2'>
        <label className='block text-sm font-semibold text-gray-700'>
          Email or Username
        </label>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            {formData.identifier.includes('@')
? (
              <FaEnvelope className={`h-5 w-5 ${isValidEmail ? 'text-green-500' : 'text-gray-400'}`} />
            )
: (
              <FaUser className={`h-5 w-5 ${formData.identifier.length >= 3 ? 'text-green-500' : 'text-gray-400'}`} />
            )}
          </div>
          <input
            type='text'
            name='identifier'
            value={formData.identifier}
            onChange={handleChange}
            className={`input-field pl-10 pr-10 ${errors.identifier ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'focus:border-blue-500 focus:ring-blue-200'} transition-all duration-200`}
            placeholder='you@example.com or username'
          />
          {formData.identifier && !errors.identifier && (
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
              <FaCheckCircle className={`h-5 w-5 ${isValidEmail || formData.identifier.length >= 3 ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          )}
        </div>
        {errors.identifier && (
          <p className='text-sm text-red-600 animate-shake'>{errors.identifier}</p>
        )}
        {formData.identifier && !errors.identifier && (
          <p className='text-xs text-gray-500'>
            {formData.identifier.includes('@') ? 'Valid email format' : 'Username accepted'}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className='space-y-2'>
        <div className='flex items-center justify-between'>
          <label className='block text-sm font-semibold text-gray-700'>
            Password
          </label>
          <Link
            to='/forgot-password'
            className='text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors'
          >
            Forgot password?
          </Link>
        </div>
        <div className='relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <FaLock className={`h-5 w-5 ${isValidPassword ? 'text-green-500' : 'text-gray-400'}`} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name='password'
            value={formData.password}
            onChange={handleChange}
            className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'focus:border-blue-500 focus:ring-blue-200'} transition-all duration-200`}
            placeholder='Enter your password'
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors'
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash className='h-5 w-5' /> : <FaEye className='h-5 w-5' />}
          </button>
        </div>
        {errors.password && (
          <p className='text-sm text-red-600 animate-shake'>{errors.password}</p>
        )}
        {formData.password && !errors.password && (
          <div className='flex items-center gap-2 mt-1'>
            <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : formData.password.length >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span className='text-xs text-gray-500'>
              {formData.password.length >= 8 ? 'Strong' : formData.password.length >= 5 ? 'Medium' : 'Weak'}
            </span>
          </div>
        )}
      </div>

      {/* Remember Me */}
      <div className='flex items-center'>
        <input
          id='remember-me'
          name='remember'
          type='checkbox'
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors'
        />
        <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-700'>
          Keep me signed in
        </label>
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={loading || !formData.identifier || !formData.password}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
          loading || !formData.identifier || !formData.password
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {loading
? (
          <div className='flex items-center justify-center gap-2'>
            <Loader size='sm' />
            <span>Signing in...</span>
          </div>
        )
: (
          'Sign in to your account'
        )}
      </button>

      {/* Divider */}
      <div className='relative my-6'>
        <div className='absolute inset-0 flex items-center'>
          <div className='w-full border-t border-gray-300' />
        </div>
        <div className='relative flex justify-center'>
          <span className='px-4 bg-white text-sm text-gray-500 font-medium'>Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <GoogleLoginButton text='Continue with Google' />

      {/* Guest Login */}
      <div className='text-center'>
        <button
          type='button'
          onClick={() => {
            setFormData({ identifier: 'guest@example.com', password: 'guest123' })
            toast.success('Guest credentials filled. Click Sign in to continue.')
          }}
          className='text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors'
        >
          Try with guest credentials
        </button>
      </div>
    </form>
  )
};

export default LoginForm
