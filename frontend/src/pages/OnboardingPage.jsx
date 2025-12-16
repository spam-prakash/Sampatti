import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import OnboardingProgress from '../components/onboarding/OnboardingProgress';
import Step1Basic from '../components/onboarding/Step1Basic';
import Step2Financial from '../components/onboarding/Step2Financial';
import Step3Preferences from '../components/onboarding/Step3Preferences';
import { ONBOARDING_STEPS } from '../utils/constants';

const OnboardingPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
      goalReminders: user?.notifications?.goalReminders ?? true,
    },
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user?.onboardingComplete) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid Indian phone number';
      }
    }

    if (currentStep === 2) {
      if (!formData.primaryMOI) {
        newErrors.primaryMOI = 'Please select your primary income source';
      }
      if (!formData.monthlyIncome || parseFloat(formData.monthlyIncome) <= 0) {
        newErrors.monthlyIncome = 'Please enter a valid monthly income';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'notifications') {
      setFormData({
        ...formData,
        notifications: value,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await authService.completeOnboarding(formData);
      
      if (response.success) {
        updateUser(response.user);
        toast.success('Profile setup complete!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600">
            A few more details to personalize your financial experience
          </p>
        </div>

        <OnboardingProgress 
          currentStep={currentStep} 
          steps={ONBOARDING_STEPS} 
        />

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentStep === 1 && (
            <Step1Basic 
              formData={formData} 
              onChange={handleChange} 
              errors={errors} 
            />
          )}
          
          {currentStep === 2 && (
            <Step2Financial 
              formData={formData} 
              onChange={handleChange} 
              errors={errors} 
            />
          )}
          
          {currentStep === 3 && (
            <Step3Preferences 
              formData={formData} 
              onChange={handleChange} 
              errors={errors} 
            />
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Back
            </button>
            
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="btn-primary px-8 py-3"
            >
              {loading ? (
                <Loader size="sm" />
              ) : currentStep === 3 ? (
                'Complete Setup'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>You can update these settings anytime from your profile.</p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;