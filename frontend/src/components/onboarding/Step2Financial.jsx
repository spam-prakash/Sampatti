import React from 'react'
import { FaMoneyBillWave, FaChartLine, FaPercentage, FaChevronDown, FaInfoCircle } from 'react-icons/fa'
import { INCOME_SOURCES } from '../../utils/constants'

const Step2Financial = ({ formData, onChange, errors }) => {
  // Simple calculation for the visual tip
  const monthlySavings = Math.round((formData.monthlyIncome || 0) * ((formData.savingsTarget || 20) / 100))

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Header Section */}
      <div className='border-b border-gray-100 pb-4'>
        <h3 className='text-xl font-bold text-gray-900 tracking-tight'>
          Financial Context
        </h3>
        <p className='text-sm text-gray-500 mt-1'>
          This helps us set up your initial budgets and tracking parameters.
        </p>
      </div>

      <div className='space-y-6'>
        {/* Income Source Select */}
        <div className='group'>
          <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
            Primary Income Source <span className='text-rose-500'>*</span>
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <FaMoneyBillWave className={`h-4 w-4 transition-colors ${errors.primaryMOI ? 'text-rose-400' : 'text-gray-300 group-focus-within:text-blue-500'}`} />
            </div>
            <select
              name='primaryMOI'
              value={formData.primaryMOI || ''}
              onChange={onChange}
              className={`w-full bg-white border-2 rounded-xl py-3 pl-11 pr-10 text-sm font-medium transition-all outline-none appearance-none
                ${errors.primaryMOI
                  ? 'border-rose-100 focus:border-rose-500 bg-rose-50/30'
                  : 'border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
              required
            >
              <option value='' disabled>Select income source</option>
              {INCOME_SOURCES.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
            <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
              <FaChevronDown className='h-3 w-3 text-gray-400' />
            </div>
          </div>
          {errors.primaryMOI && <p className='mt-2 text-[11px] font-bold text-rose-500 uppercase tracking-tight'>{errors.primaryMOI}</p>}
        </div>

        {/* Monthly Income Input */}
        <div className='group'>
          <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
            Monthly Take-Home Pay (₹) <span className='text-rose-500'>*</span>
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <FaChartLine className={`h-4 w-4 transition-colors ${errors.monthlyIncome ? 'text-rose-400' : 'text-gray-300 group-focus-within:text-blue-500'}`} />
            </div>
            <input
              type='number'
              name='monthlyIncome'
              value={formData.monthlyIncome || ''}
              onChange={onChange}
              className={`w-full bg-white border-2 rounded-xl py-3 pl-11 pr-12 text-sm font-medium transition-all outline-none
                ${errors.monthlyIncome
                  ? 'border-rose-100 focus:border-rose-500 bg-rose-50/30'
                  : 'border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
              placeholder='e.g. 75000'
              min='0'
              step='1000'
              required
            />
            <div className='absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none'>
              <span className='text-xs font-bold text-gray-300 group-focus-within:text-blue-400 transition-colors'>INR</span>
            </div>
          </div>
          {errors.monthlyIncome && <p className='mt-2 text-[11px] font-bold text-rose-500 uppercase tracking-tight'>{errors.monthlyIncome}</p>}
        </div>

        {/* Savings Target Slider */}
        <div className='group pt-2'>
          <div className='flex justify-between items-center mb-4'>
            <label className='block text-xs font-black uppercase tracking-widest text-gray-400'>
              Savings Target
            </label>
            <span className='text-xs font-bold px-2 py-1 bg-blue-600 text-white rounded-lg shadow-sm shadow-blue-200'>
              {formData.savingsTarget || 20}%
            </span>
          </div>

          <input
            type='range'
            name='savingsTarget'
            value={formData.savingsTarget || 20}
            onChange={onChange}
            className='w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600'
            min='0'
            max='100'
          />

          <div className='flex justify-between mt-3 px-1'>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter'>Aggressive (0%)</span>
            <div className='text-center'>
              <p className='text-xs font-bold text-blue-600'>₹{monthlySavings.toLocaleString('en-IN')}</p>
              <p className='text-[9px] text-gray-400 font-medium uppercase tracking-widest'>Monthly Goal</p>
            </div>
            <span className='text-[10px] font-bold text-gray-400 uppercase tracking-tighter'>Saving (100%)</span>
          </div>
        </div>
      </div>

      {/* AI Note */}
      <div className='bg-indigo-50/50 p-4 rounded-2xl flex items-start gap-3 border border-indigo-100/50'>
        <div className='p-2 bg-white rounded-xl shadow-sm'>
          <FaInfoCircle className='text-indigo-600 w-4 h-4' />
        </div>
        <p className='text-[11px] text-indigo-900 leading-relaxed font-medium'>
          We use these figures to build your <span className='font-bold'>Automatic Budget Plan</span>. You can adjust your targets anytime in your settings.
        </p>
      </div>
    </div>
  )
};

export default Step2Financial
