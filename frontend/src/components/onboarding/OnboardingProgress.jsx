import React from 'react';
import { FaCheck } from 'react-icons/fa';

const OnboardingProgress = ({ currentStep = 1, steps = [] }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep > step.id
                    ? 'bg-green-500 border-green-500'
                    : currentStep === step.id
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {currentStep > step.id ? (
                  <FaCheck className="w-5 h-5 text-white" />
                ) : (
                  <span
                    className={`font-semibold ${
                      currentStep === step.id
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.id}
                  </span>
                )}
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700">
                {step.title}
              </span>
              <span className="text-xs text-gray-500">{step.description}</span>
            </div>
            
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 ${
                  currentStep > step.id
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default OnboardingProgress;