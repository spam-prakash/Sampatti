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
        toast.error(data.error || 'Failed to send OTP')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
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
        toast.error(data.error || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
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
    <div className='w-full'>
      {step === 1 && (
        <form onSubmit={handleEmailSubmit} className='space-y-4 md:space-y-6 animate-in fade-in duration-500'>
          <div className='space-y-1.5 md:space-y-2'>
            <label className='block text-xs md:text-sm font-semibold text-gray-700 uppercase tracking-wider'>
              Email Address
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                <FaEnvelope className='h-4 w-4 md:h-5 md:w-5 text-gray-400' />
              </div>
              <input
                type='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                className='w-full py-3 md:py-3.5 pl-11 pr-4 text-sm md:text-base bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all'
                placeholder='you@example.com'
                required
              />
            </div>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3.5 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none flex items-center justify-center'
          >
            {loading ? <Loader size='sm' /> : 'Continue with Email'}
          </button>

          <div className='relative py-2'>
            <div className='absolute inset-0 flex items-center'><div className='w-full border-t border-gray-100' /></div>
            <div className='relative flex justify-center text-[10px] md:text-xs uppercase'><span className='px-3 bg-white text-gray-400 tracking-widest font-medium'>OR</span></div>
          </div>

          <GoogleLoginButton text='Sign up with Google' />
        </form>
      )}

      {step === 2 && (
        <div className='animate-in slide-in-from-right-4 duration-500'>
          <OTPForm
            email={formData.email}
            onOTPSubmit={handleOTPSubmit}
            onOTPChange={(otp) => setFormData({ ...formData, otp })}
            loading={loading}
            otpSent={otpSent}
          />
        </div>
      )}

      {step === 3 && (
        <form onSubmit={handleSignupSubmit} className='space-y-4 md:space-y-5 animate-in slide-in-from-right-4 duration-500'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Full Name */}
            <div className='space-y-1.5'>
              <label className='block text-[11px] md:text-xs font-bold text-gray-500 uppercase'>Full Name</label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                  <FaUser className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='w-full py-2.5 md:py-3 pl-10 pr-4 text-sm bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all'
                  placeholder='John Doe'
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className='space-y-1.5'>
              <label className='block text-[11px] md:text-xs font-bold text-gray-500 uppercase'>Username</label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                  <FaUser className='h-4 w-4 text-gray-400' />
                </div>
                <input
                  type='text'
                  name='username'
                  value={formData.username}
                  onChange={handleChange}
                  className='w-full py-2.5 md:py-3 pl-10 pr-4 text-sm bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-all'
                  placeholder='johndoe'
                  required
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] md:text-xs font-bold text-gray-500 uppercase'>Password</label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                <FaLock className='h-4 w-4 text-gray-400' />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name='password'
                value={formData.password}
                onChange={(e) => { handleChange(e); if (errors.password) setErrors({ ...errors, password: '' }) }}
                className={`w-full py-2.5 md:py-3 pl-10 pr-10 text-sm bg-gray-50/50 border rounded-xl outline-none focus:border-blue-500 transition-all ${errors.password ? 'border-red-400' : 'border-gray-200'}`}
                placeholder='••••••••'
                required
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'
              >
                {showPassword ? <FaEyeSlash className='h-4 w-4' /> : <FaEye className='h-4 w-4' />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className='space-y-1.5'>
            <label className='block text-[11px] md:text-xs font-bold text-gray-500 uppercase'>Confirm Password</label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                <FaCheck className='h-4 w-4 text-gray-400' />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                name='confirmPassword'
                value={formData.confirmPassword}
                onChange={(e) => { handleChange(e); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' }) }}
                className={`w-full py-2.5 md:py-3 pl-10 pr-10 text-sm bg-gray-50/50 border rounded-xl outline-none focus:border-blue-500 transition-all ${errors.confirmPassword ? 'border-red-400' : 'border-gray-200'}`}
                placeholder='••••••••'
                required
              />
              <button
                type='button'
                onClick={() => setShowConfirm(!showConfirm)}
                className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400'
              >
                {showConfirm ? <FaEyeSlash className='h-4 w-4' /> : <FaEye className='h-4 w-4' />}
              </button>
            </div>
            {errors.confirmPassword && <p className='text-[10px] text-red-500 font-medium pl-1'>{errors.confirmPassword}</p>}
          </div>

          <div className='flex items-center py-1'>
            <input
              id='signup-remember'
              type='checkbox'
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer'
            />
            <label htmlFor='signup-remember' className='ml-2.5 block text-xs md:text-sm text-gray-600 cursor-pointer select-none'>
              Keep me signed in
            </label>
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full py-3.5 md:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all active:scale-95 disabled:bg-gray-300 flex items-center justify-center'
          >
            {loading ? <Loader size='sm' /> : 'Complete Registration'}
          </button>
        </form>
      )}
    </div>
  )
}

export default SignupForm
