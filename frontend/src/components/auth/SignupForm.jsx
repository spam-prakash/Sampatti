import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { FaUser, FaEnvelope, FaLock, FaCheck, FaEye, FaEyeSlash } from 'react-icons/fa'
import Loader from '../common/Loader'
import OTPForm from './OTPForm'
import GoogleLoginButton from './GoogleLoginButton'
import toast from 'react-hot-toast'

const SignupForm = () => {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Basic Info
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Generate OTP
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/generateotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (data.success) {
        setOtpSent(true)
        setStep(2)
      } else {
        alert(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Verify OTP
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        })
      })

      const data = await response.json()

      if (data.success) {
        setStep(3)
      } else {
        alert(data.error || 'Invalid OTP')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignupSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' })
      return
    }

    setLoading(true)

    const result = await signup({
      email: formData.email,
      username: formData.username,
      name: formData.name,
      password: formData.password,
      otp: formData.otp
    }, remember)

    setLoading(false)

    if (!result.success) {
      toast.error(result.error || 'Signup failed')
      return
    }

    toast.success('Account created successfully')
    navigate('/onboarding')
  }

  return (
    <div className='form-container'>
      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FaEnvelope className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                className='input-field pl-10'
                placeholder='you@example.com'
                required
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='btn-primary w-full flex items-center justify-center'
          >
            {loading
              ? (
                <Loader size='sm' />
                )
              : (
                  'Continue with Email'
                )}
          </button>

          <div className='relative my-6'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>Or continue with</span>
            </div>
          </div>

          <GoogleLoginButton />
        </form>
      )}

      {step === 2 && (
        <OTPForm
          email={formData.email}
          onOTPSubmit={handleOTPSubmit}
          onOTPChange={(otp) => setFormData({ ...formData, otp })}
          loading={loading}
          otpSent={otpSent}
        />
      )}

      {step === 3 && (
        <form onSubmit={handleSignupSubmit} className='space-y-6'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Full Name
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FaUser className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                name='name'
                value={formData.name}
                onChange={handleChange}
                className='input-field pl-10'
                placeholder='John Doe'
                required
                minLength={3}
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Username
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FaUser className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type='text'
                name='username'
                value={formData.username}
                onChange={handleChange}
                className='input-field pl-10'
                placeholder='johndoe'
                required
                minLength={3}
                pattern='^[A-Za-z0-9_.-]+$'
              />
            </div>
            <p className='mt-1 text-xs text-gray-500'>
              Only letters, numbers, _ . - are allowed
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FaLock className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                value={formData.password}
                onChange={(e) => { handleChange(e); if (errors.password) setErrors({ ...errors, password: '' }) }}
                className={`input-field pl-10 ${errors.password ? 'border-red-400' : ''}`}
                placeholder='••••••••'
                required
                minLength={5}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.password && <p className='text-xs text-red-600 mt-1'>{errors.password}</p>}
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Confirm Password
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <FaCheck className='h-5 w-5 text-gray-400' />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={(e) => { handleChange(e); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }) }}
                className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-400' : ''}`}
                placeholder='••••••••'
                required
                minLength={5}
              />
              <button
                type='button'
                onClick={() => setShowConfirm(!showConfirm)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500'
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </button>
              {errors.confirmPassword && <p className='text-xs text-red-600 mt-1'>{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className='flex items-center'>
            <input
              id='signup-remember'
              name='remember'
              type='checkbox'
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded'
            />
            <label htmlFor='signup-remember' className='ml-2 block text-sm text-gray-700'>
              Keep me signed in
            </label>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='btn-primary w-full flex items-center justify-center'
          >
            {loading
              ? (
                <Loader size='sm' />
                )
              : (
                  'Create Account'
                )}
          </button>
        </form>
      )}
    </div>
  )
}

export default SignupForm
