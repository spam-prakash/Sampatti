import React from 'react'
import { FaUser, FaEnvelope, FaPhone, FaLock } from 'react-icons/fa'

const Step1Basic = ({ formData, onChange, errors }) => {
  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Header Section */}
      <div className='border-b border-gray-100 pb-4'>
        <h3 className='text-xl font-bold text-gray-900 tracking-tight'>
          Personal Information
        </h3>
        <p className='text-sm text-gray-500 mt-1'>
          Setting up your profile helps us calculate more accurate financial insights.
        </p>
      </div>

      <div className='space-y-5'>
        {/* Full Name Field */}
        <div className='group'>
          <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
            Full Name <span className='text-rose-500'>*</span>
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <FaUser className={`h-4 w-4 transition-colors ${errors.name ? 'text-rose-400' : 'text-gray-300 group-focus-within:text-blue-500'}`} />
            </div>
            <input
              type='text'
              name='name'
              value={formData.name || ''}
              onChange={onChange}
              className={`w-full bg-white border-2 rounded-xl py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none
                ${errors.name
                  ? 'border-rose-100 focus:border-rose-500 bg-rose-50/30'
                  : 'border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
              placeholder='e.g. Prakash Kumar'
              required
            />
          </div>
          {errors.name && (
            <p className='mt-2 text-[11px] font-bold text-rose-500 uppercase tracking-tight flex items-center gap-1'>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field (Locked) */}
        <div className='group'>
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-xs font-black uppercase tracking-widest text-gray-400'>
              Email Address
            </label>
            <span className='flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded'>
              <FaLock className='w-2 h-2' /> Verified
            </span>
          </div>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <FaEnvelope className='h-4 w-4 text-gray-300' />
            </div>
            <input
              type='email'
              name='email'
              value={formData.email || ''}
              className='w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pl-11 pr-4 text-sm font-medium text-gray-500 cursor-not-allowed'
              disabled
            />
          </div>
          <p className='mt-2 text-[11px] font-medium text-gray-400 italic'>
            Joined via Google. Email cannot be modified for security.
          </p>
        </div>

        {/* Phone Number Field */}
        <div className='group'>
          <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
            Phone Number <span className='text-gray-300 font-normal normal-case'>(Optional)</span>
          </label>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
              <FaPhone className={`h-4 w-4 transition-colors ${errors.phone ? 'text-rose-400' : 'text-gray-300 group-focus-within:text-blue-500'}`} />
            </div>
            <input
              type='tel'
              name='phone'
              value={formData.phone || ''}
              onChange={onChange}
              className={`w-full bg-white border-2 rounded-xl py-3 pl-11 pr-4 text-sm font-medium transition-all outline-none
                ${errors.phone
                  ? 'border-rose-100 focus:border-rose-500 bg-rose-50/30'
                  : 'border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50'}`}
              placeholder='98765 43210'
            />
          </div>
          <p className='mt-2 text-[11px] font-medium text-gray-400'>
            Used for critical alerts and two-factor authentication.
          </p>
          {errors.phone && (
            <p className='mt-2 text-[11px] font-bold text-rose-500 uppercase tracking-tight'>
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Trust Footer */}
      <div className='bg-blue-50/50 p-4 rounded-xl flex items-start gap-3'>
        <div className='p-2 bg-white rounded-lg shadow-sm'>
          <FaLock className='text-blue-600 w-3 h-3' />
        </div>
        <p className='text-[11px] text-blue-800 leading-relaxed font-medium'>
          Your data is encrypted and secure. We never share your personal information with third parties.
        </p>
      </div>
    </div>
  )
};

export default Step1Basic
