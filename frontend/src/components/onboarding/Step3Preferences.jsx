import React from 'react'
import { FaGlobe, FaLanguage, FaBell, FaChevronDown, FaShieldAlt } from 'react-icons/fa'
import { CURRENCIES, LANGUAGES } from '../../utils/constants'

const Step3Preferences = ({ formData, onChange, errors }) => {
  // Helper to handle nested notification changes
  const handleToggle = (field) => {
    const currentNotifications = formData.notifications || {
      emailNotifications: true,
      lowBalanceAlert: true,
      goalReminders: true
    }
    
    onChange({
      target: {
        name: 'notifications',
        value: {
          ...currentNotifications,
          [field]: !currentNotifications[field]
        }
      }
    })
  };

  return (
    <div className='space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Header Section */}
      <div className='border-b border-gray-100 pb-4'>
        <h3 className='text-xl font-bold text-gray-900 tracking-tight'>
          App Preferences
        </h3>
        <p className='text-sm text-gray-500 mt-1'>
          Last step! Personalize how you want to interact with Sampatti.
        </p>
      </div>

      <div className='space-y-6'>
        {/* Localization Group */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='group'>
            <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
              Currency
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <FaGlobe className='h-4 w-4 text-gray-300 group-focus-within:text-blue-500 transition-colors' />
              </div>
              <select
                name='currency'
                value={formData.currency || 'INR'}
                onChange={onChange}
                className='w-full bg-white border-2 border-gray-100 rounded-xl py-3 pl-11 pr-10 text-sm font-medium transition-all outline-none appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              >
                {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <FaChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none' />
            </div>
          </div>

          <div className='group'>
            <label className='block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 transition-colors group-focus-within:text-blue-600'>
              Language
            </label>
            <div className='relative'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <FaLanguage className='h-4 w-4 text-gray-300 group-focus-within:text-blue-500 transition-colors' />
              </div>
              <select
                name='language'
                value={formData.language || 'en'}
                onChange={onChange}
                className='w-full bg-white border-2 border-gray-100 rounded-xl py-3 pl-11 pr-10 text-sm font-medium transition-all outline-none appearance-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50'
              >
                {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              <FaChevronDown className='absolute right-4 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none' />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className='space-y-4'>
          <div className='flex items-center gap-2 px-1'>
            <FaBell className='w-4 h-4 text-blue-600' />
            <h4 className='text-xs font-black uppercase tracking-widest text-gray-900'>
              Security & Alerts
            </h4>
          </div>

          <div className='bg-gray-50/50 border border-gray-100 rounded-2xl p-2 space-y-1'>
            {[
              { id: 'emailNotifications', label: 'Email Reports', desc: 'Weekly summaries of your spending' },
              { id: 'lowBalanceAlert', label: 'Low Balance', desc: 'Alert when accounts drop below limit' },
              { id: 'goalReminders', label: 'Goal Tracking', desc: 'Reminders for your saving targets' }
            ].map((item) => (
              <div key={item.id} className='flex items-center justify-between p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all group'>
                <div>
                  <p className='text-sm font-bold text-gray-800'>{item.label}</p>
                  <p className='text-[10px] text-gray-400 font-medium'>{item.desc}</p>
                </div>

                {/* Toggle Switch */}
                <label className='relative inline-flex items-center cursor-pointer'>
                  <input
                    type='checkbox'
                    className='sr-only peer'
                    checked={formData.notifications?.[item.id] ?? true}
                    onChange={() => handleToggle(item.id)}
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Final Trust Note */}
        <div className='flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100'>
          <div className='w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm'>
            <FaShieldAlt className='text-emerald-500 w-5 h-5' />
          </div>
          <p className='text-[11px] text-emerald-900 font-medium leading-tight'>
            Sampatti uses bank-grade encryption to secure your preferences. You can change these anytime in the settings dashboard.
          </p>
        </div>
      </div>
    </div>
  )
};

export default Step3Preferences
