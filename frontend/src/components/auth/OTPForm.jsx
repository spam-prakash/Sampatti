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
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Ensure only 1 character
    setOtp(newOtp)

    onOTPChange(newOtp.join(''))

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
      const updatedOtp = [...otp]
      newOtp.forEach((char, i) => {
        if (i < 6) {
          updatedOtp[i] = char
          if (inputsRef.current[i]) inputsRef.current[i].value = char
        }
      })
      setOtp(updatedOtp)
      onOTPChange(updatedOtp.join(''))
      // Focus the last filled input or the first empty one
      const nextFocus = Math.min(newOtp.length, 5)
      inputsRef.current[nextFocus]?.focus()
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
      }
    } catch (error) {
      console.error('Failed to resend OTP')
    }
  }

  return (
    <form onSubmit={(e) => onOTPSubmit(e, otp.join(''))} className='space-y-6 w-full'>
      {/* Header Section */}
      <div className='text-center mb-4 md:mb-6 px-2'>
        <div className='inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full mb-3 md:mb-4'>
          <FaEnvelope className='w-5 h-5 md:w-6 md:h-6 text-blue-600' />
        </div>
        <h3 className='text-base md:text-lg font-bold text-gray-900'>Verify your email</h3>
        <p className='text-sm text-gray-600 mt-1.5 leading-relaxed'>
          Enter the code sent to <br className='sm:hidden' />
          <span className='font-semibold text-gray-800 break-all'>{email}</span>
        </p>
      </div>

      {/* OTP Inputs Container */}
      <div className='space-y-6'>
        <div className='flex justify-between items-center gap-1 sm:gap-2 max-w-[320px] md:max-w-sm mx-auto'>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputsRef.current[index] = el)}
              type='text'
              inputMode='numeric'
              pattern='\d*'
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className='w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all bg-gray-50/50'
              autoFocus={index === 0}
            />
          ))}
        </div>

        {/* Timer Section */}
        <div className='flex items-center justify-center text-xs md:text-sm font-medium text-gray-500 bg-gray-100/50 py-2 px-4 rounded-full w-fit mx-auto'>
          <FaClock className='w-3.5 h-3.5 mr-2 text-blue-500' />
          <span>Expires in: <span className='text-blue-700 font-mono'>{formatTime(timeLeft)}</span></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='space-y-4 pt-2'>
        <button
          type='submit'
          disabled={loading || otp.join('').length !== 6}
          className={`w-full py-3.5 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all shadow-md active:scale-95 ${
            otp.join('').length === 6 && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          {loading
? (
            <div className='flex items-center justify-center gap-2'>
              <Loader size='sm' />
              <span>Verifying...</span>
            </div>
          )
: (
            'Verify & Continue'
          )}
        </button>

        <div className='text-center'>
          <button
            type='button'
            onClick={handleResendOTP}
            disabled={!canResend}
            className={`text-xs md:text-sm font-semibold transition-colors ${
              canResend
                ? 'text-blue-600 hover:text-blue-800'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            {canResend ? "Didn't receive code? Resend" : `Resend available in ${formatTime(timeLeft)}`}
          </button>
        </div>
      </div>
    </form>
  )
}

export default OTPForm
