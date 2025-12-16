import React from 'react';
import { FaMoneyBillWave, FaChartLine, FaPercentage } from 'react-icons/fa';
import { INCOME_SOURCES } from '../../utils/constants';

const Step2Financial = ({ formData, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Financial Information
        </h3>
        <p className="text-gray-600">
          Help us understand your financial situation for better insights.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Source of Income *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaMoneyBillWave className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="primaryMOI"
              value={formData.primaryMOI || ''}
              onChange={onChange}
              className="input-field pl-10 appearance-none"
              required
            >
              <option value="">Select income source</option>
              {INCOME_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>
          {errors.primaryMOI && (
            <p className="mt-1 text-sm text-red-600">{errors.primaryMOI}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly Income (₹) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaChartLine className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="monthlyIncome"
              value={formData.monthlyIncome || ''}
              onChange={onChange}
              className="input-field pl-10"
              placeholder="50000"
              min="0"
              step="1000"
              required
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500">₹</span>
            </div>
          </div>
          {errors.monthlyIncome && (
            <p className="mt-1 text-sm text-red-600">{errors.monthlyIncome}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Savings Target (% of income)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPercentage className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="range"
              name="savingsTarget"
              value={formData.savingsTarget || 20}
              onChange={onChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              min="0"
              max="100"
            />
            <div className="flex justify-between mt-1">
              <span className="text-sm text-gray-500">0%</span>
              <span className="text-sm font-medium text-primary-600">
                {formData.savingsTarget || 20}%
              </span>
              <span className="text-sm text-gray-500">100%</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Recommended: 20% of your income
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This information helps our AI provide personalized financial insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Financial;