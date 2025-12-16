import React, { useState, useEffect, useRef } from 'react'
import { FaEnvelope, FaClock } from 'react-icons/fa'
import Loader from '../common/Loader'

const OTPForm = ({ email, onOTPSubmit, onOTPChange, loading, otpSent }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const inputsRef = useRef([])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  };

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    
    // Update parent component
    onOTPChange(newOtp.join(''))
    
    // Auto-focus next input
    if (value && index < 5) {
      inputsRef.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('')
      for (let i = 0; i < 6; i++) {
        if (inputsRef.current[i]) {
          inputsRef.current[i].value = newOtp[i] || ''
          handleChange(i, newOtp[i] || '')
        }
      }
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/generateotp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      if (data.success) {
        setTimeLeft(600)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputsRef.current[0]?.focus()
        alert('New OTP sent to your email')
      }
    } catch (error) {
      alert('Failed to resend OTP')
    }
  }

  return (
    <form onSubmit={(e) => onOTPSubmit(e, otp.join(''))} className='space-y-6'>
      <div className='text-center mb-6'>
        <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4'>
          <FaEnvelope className='w-6 h-6 text-blue-600' />
        </div>
        <h3 className='text-lg font-semibold text-gray-900'>Verify your email</h3>
        <p className='text-gray-600 mt-2'>
          Enter the 6-digit code sent to <span className='font-medium'>{email}</span>
        </p>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-center space-x-2 mb-2'>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type='text'
              inputMode='numeric'
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className='w-12 h-12 text-center text-xl font-semibold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors'
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className='flex items-center justify-center text-sm text-gray-600'>
          <FaClock className='w-4 h-4 mr-2' />
          <span>Code expires in {formatTime(timeLeft)}</span>
        </div>
      </div>

      <button
        type='submit'
        disabled={loading || otp.join('').length !== 6}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          otp.join('').length === 6 && !loading
            ? 'btn-primary'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading
? (
          <div className='flex items-center justify-center'>
            <Loader size='sm' />
          </div>
        )
: (
          'Verify OTP'
        )}
      </button>

      <div className='text-center'>
        <button
          type='button'
          onClick={handleResendOTP}
          disabled={!canResend}
          className={`text-sm font-medium ${
            canResend
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-gray-400 cursor-not-allowed'
          }`}
        >
          Didn't receive code? Resend OTP
        </button>
      </div>
    </form>
  )
};

export default OTPForm
