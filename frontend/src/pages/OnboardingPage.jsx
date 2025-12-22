import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import authService from '../services/authService'
import toast from 'react-hot-toast'
import Loader from '../components/common/Loader'
import OnboardingProgress from '../components/onboarding/OnboardingProgress'
import Step1Basic from '../components/onboarding/Step1Basic'
import Step2Financial from '../components/onboarding/Step2Financial'
import Step3Preferences from '../components/onboarding/Step3Preferences'
import { ONBOARDING_STEPS } from '../utils/constants'

const OnboardingPage = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    primaryMOI: user?.primaryMOI || '',
    monthlyIncome: user?.monthlyIncome || '',
    savingsTarget: user?.savingsTarget || 20,
    currency: user?.currency || 'INR',
    language: user?.language || 'en',
    notifications: {
      emailNotifications: user?.notifications?.emailNotifications ?? true,
      lowBalanceAlert: user?.notifications?.lowBalanceAlert ?? true,
      goalReminders: user?.notifications?.goalReminders ?? true
    },
  })

  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const validateStep = () => {
    const newErrors = {}
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Enter a valid 10-digit phone number'
      }
    }
    if (currentStep === 2) {
      if (!formData.primaryMOI) newErrors.primaryMOI = 'Select an income source'
      if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
        newErrors.monthlyIncome = 'Monthly income must be greater than 0'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    // Handle Nested Notifications or Checkboxes
    if (type === 'checkbox' && name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: checked }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast.error('Please complete the required fields')
      return;
    }
    if (currentStep < 3) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setCurrentStep(prev => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await authService.completeOnboarding(formData)
      if (response.success) {
        updateUser(response.user)
        toast.success('Welcome aboard!')
        navigate('/dashboard')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading && currentStep === 3) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-white'>
        <Loader size='lg' />
        <p className='mt-4 text-gray-500 font-medium animate-pulse'>Personalizing your dashboard...</p>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F8FAFC] py-8 md:py-16 px-4'>
      <div className='max-w-2xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-10'>
          <div className='inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-xl mb-4 shadow-lg shadow-blue-200 font-bold text-xl'>
            S
          </div>
          <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>
            Let's customize your vault
          </h1>
          <p className='text-gray-500 mt-2'>
            Step {currentStep} of 3: {ONBOARDING_STEPS[currentStep - 1].title}
          </p>
        </div>

        {/* Progress Bar Component */}
        <OnboardingProgress currentStep={currentStep} steps={ONBOARDING_STEPS} />

        {/* Step Container */}
        <div className='bg-white rounded-3xl shadow-xl shadow-blue-100/40 border border-gray-100 overflow-hidden transition-all duration-300'>
          <div className='p-6 md:p-10'>
            {currentStep === 1 && <Step1Basic formData={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 2 && <Step2Financial formData={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 3 && <Step3Preferences formData={formData} onChange={handleChange} errors={errors} />}

            {/* Navigation Buttons */}
            <div className='flex items-center gap-4 mt-10 pt-8 border-t border-gray-50'>
              <button
                type='button'
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1 || loading}
                className='flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-0 transition-all'
              >
                Back
              </button>

              <button
                type='button'
                onClick={handleNext}
                disabled={loading}
                className='flex-[2] bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2'
              >
                {currentStep === 3 ? 'Get Started' : 'Continue'}
              </button>
            </div>
          </div>
        </div>

        <p className='mt-8 text-center text-xs text-gray-400 font-medium'>
          Your data is encrypted and securely stored.
        </p>
      </div>
    </div>
  )
};

export default OnboardingPage
