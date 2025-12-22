import React from 'react'
import { FaCheck } from 'react-icons/fa'

const OnboardingProgress = ({ currentStep = 1, steps = [] }) => {
  return (
    <div className='w-full py-4 px-2'>
      <div className='flex items-center'>
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isActive = currentStep === step.id

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle & Labels */}
              <div className='relative flex flex-col items-center group'>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ease-in-out shadow-sm ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-500'
                      : isActive
                      ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {isCompleted
? (
                    <FaCheck className='w-4 h-4 text-white animate-in zoom-in duration-300' />
                  )
: (
                    <span
                      className={`text-sm font-bold transition-colors duration-500 ${
                        isActive ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Labels - Centered absolutely on mobile if needed, or hidden */}
                <div className='absolute top-12 flex flex-col items-center w-32 text-center pointer-events-none'>
                  <span className={`text-[11px] md:text-xs font-black uppercase tracking-wider transition-colors duration-300 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                  >
                    {step.title}
                  </span>
                  {/* Descriptions hidden on small mobile screens to save vertical space */}
                  <span className='hidden sm:block text-[10px] text-gray-400 mt-0.5 leading-tight px-2'>
                    {step.description}
                  </span>
                </div>
              </div>

              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className='flex-1 mx-2 mb-6'> {/* Margin bottom 6 to align line with circles */}
                  <div className='relative h-1 w-full bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-700 ease-in-out'
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
      {/* Spacer for the absolute positioned labels */}
      <div className='h-16 sm:h-20' />
    </div>
  )
};

export default OnboardingProgress
