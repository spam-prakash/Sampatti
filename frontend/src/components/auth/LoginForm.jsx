import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaCheckCircle } from 'react-icons/fa'
import Loader from '../common/Loader'
import GoogleLoginButton from './GoogleLoginButton'
import toast from 'react-hot-toast'

const LoginForm = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [isValidEmail, setIsValidEmail] = useState(false)
  const [isValidPassword, setIsValidPassword] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search)
    const message = queryParams.get('message')
    if (message) {
      toast.success(message)
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location])

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
    
    if (name === 'identifier') {
      setIsValidEmail(value.includes('@') ? validateEmail(value) : value.length >= 3)
    }
    if (name === 'password') {
      setIsValidPassword(value.length >= 5)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Required'
    } else if (formData.identifier.includes('@') && !validateEmail(formData.identifier)) {
      newErrors.identifier = 'Invalid email'
    }
    if (!formData.password) {
      newErrors.password = 'Required'
    } else if (formData.password.length < 5) {
      newErrors.password = 'Min 5 chars'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const result = await login(formData.identifier, formData.password, remember)
      if (result.success) {
        toast.success('Signed in successfully!')
        setTimeout(() => {
          navigate(result.requiresOnboarding ? '/onboarding' : '/dashboard')
        }, 500)
      } else {
        toast.error(result.error || 'Invalid credentials.')
        setFormData(prev => ({ ...prev, password: '' }))
      }
    } catch (error) {
      toast.error('Network error. Check connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3 md:space-y-4'>
      {/* Email/Username Field */}
      <div className='space-y-1'>
        <label className='block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest ml-1'>
          Email or Username
        </label>
        <div className='relative group'>
          <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
            {formData.identifier.includes('@')
              ? <FaEnvelope className={`h-4 w-4 transition-colors ${isValidEmail ? 'text-blue-500' : 'text-gray-400'}`} />
              : <FaUser className={`h-4 w-4 transition-colors ${formData.identifier.length >= 3 ? 'text-blue-500' : 'text-gray-400'}`} />}
          </div>
          <input
            type='text'
            name='identifier'
            value={formData.identifier}
            onChange={handleChange}
            autoComplete='username'
            className={`w-full py-2.5 md:py-3 pl-11 pr-10 text-sm bg-gray-50/50 border rounded-xl outline-none focus:ring-4 transition-all ${
              errors.identifier ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
            }`}
            placeholder='you@example.com'
          />
          {formData.identifier && !errors.identifier && (
            <div className='absolute inset-y-0 right-0 pr-3 flex items-center'>
              <FaCheckCircle className={`h-3.5 w-3.5 ${isValidEmail || formData.identifier.length >= 3 ? 'text-green-500' : 'text-gray-300'}`} />
            </div>
          )}
        </div>
        {errors.identifier && (
          <p className='text-[10px] text-red-600 font-bold pl-1'>{errors.identifier}</p>
        )}
      </div>

      {/* Password Field */}
      <div className='space-y-1'>
        <div className='flex items-center justify-between px-1'>
          <label className='block text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest'>
            Password
          </label>
          <Link to='/forgot-password' tabIndex='-1' className='text-[10px] md:text-xs text-blue-600 hover:text-blue-700 font-bold'>
            Forgot?
          </Link>
        </div>
        <div className='relative group'>
          <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
            <FaLock className={`h-4 w-4 transition-colors ${isValidPassword ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name='password'
            value={formData.password}
            onChange={handleChange}
            autoComplete='current-password'
            className={`w-full py-2.5 md:py-3 pl-11 pr-10 text-sm bg-gray-50/50 border rounded-xl outline-none focus:ring-4 transition-all ${
              errors.password ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/10'
            }`}
            placeholder='••••••••'
          />
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors'
          >
            {showPassword ? <FaEyeSlash className='h-4 w-4' /> : <FaEye className='h-4 w-4' />}
          </button>
        </div>

        {/* Compact Password Strength */}
        {formData.password && !errors.password && (
          <div className='flex items-center gap-2 mt-1.5 px-1'>
            <div className='flex-1 flex gap-1'>
              <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 1 ? (formData.password.length >= 8 ? 'bg-green-500' : formData.password.length >= 5 ? 'bg-yellow-500' : 'bg-red-500') : 'bg-gray-100'}`} />
              <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 5 ? (formData.password.length >= 8 ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-100'}`} />
              <div className={`h-1 flex-1 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-100'}`} />
            </div>
            <span className='text-[9px] text-gray-400 font-bold uppercase'>
              {formData.password.length >= 8 ? 'Strong' : formData.password.length >= 5 ? 'Fair' : 'Weak'}
            </span>
          </div>
        )}
      </div>

      {/* Remember Me & Footer actions */}
      <div className='flex items-center py-0.5 px-1'>
        <input
          id='remember-me'
          type='checkbox'
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className='h-3.5 w-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer'
        />
        <label htmlFor='remember-me' className='ml-2 text-xs text-gray-500 font-medium cursor-pointer select-none'>
          Keep me signed in
        </label>
      </div>

      {/* Submit Button */}
      <button
        type='submit'
        disabled={loading || !formData.identifier || !formData.password}
        className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] ${
          loading || !formData.identifier || !formData.password
            ? 'bg-gray-200 cursor-not-allowed shadow-none'
            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
        }`}
      >
        {loading
? (
          <div className='flex items-center justify-center gap-2'>
            <Loader size='xs' />
            <span className='text-sm'>Verifying...</span>
          </div>
        )
: 'Sign In'}
      </button>

      {/* Divider */}
      <div className='relative py-1'>
        <div className='absolute inset-0 flex items-center'><div className='w-full border-t border-gray-100' /></div>
        <div className='relative flex justify-center text-[10px] uppercase'><span className='px-3 bg-white text-gray-300 tracking-[0.2em] font-bold'>OR</span></div>
      </div>

      <GoogleLoginButton text='Sign in with Google' />

      {/* Guest Access Link */}
      <div className='text-center pt-1'>
        <button
          type='button'
          onClick={() => {
            setFormData({ identifier: 'guest@example.com', password: 'guest123' })
            toast.success('Guest credentials loaded.')
          }}
          className='text-[11px] text-gray-400 hover:text-blue-600 font-bold transition-all decoration-dotted underline-offset-4 hover:underline'
        >
          Use Guest Access
        </button>
      </div>
    </form>
  )
};

export default LoginForm
