import React from 'react';
import { FaGlobe, FaLanguage, FaBell } from 'react-icons/fa';
import { CURRENCIES, LANGUAGES } from '../../utils/constants';

const Step3Preferences = ({ formData, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Preferences
        </h3>
        <p className="text-gray-600">
          Customize your experience with Sampatti.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Currency *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaGlobe className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="currency"
              value={formData.currency || 'INR'}
              onChange={onChange}
              className="input-field pl-10 appearance-none"
              required
            >
              {CURRENCIES.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Language
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLanguage className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="language"
              value={formData.language || 'en'}
              onChange={onChange}
              className="input-field pl-10 appearance-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center">
            <FaBell className="w-4 h-4 mr-2 text-gray-400" />
            Notification Preferences
          </h4>
          
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications.emailNotifications"
                checked={formData.notifications?.emailNotifications ?? true}
                onChange={(e) => onChange({
                  target: {
                    name: 'notifications',
                    value: {
                      ...formData.notifications,
                      emailNotifications: e.target.checked
                    }
                  }
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Email notifications
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications.lowBalanceAlert"
                checked={formData.notifications?.lowBalanceAlert ?? true}
                onChange={(e) => onChange({
                  target: {
                    name: 'notifications',
                    value: {
                      ...formData.notifications,
                      lowBalanceAlert: e.target.checked
                    }
                  }
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Low balance alerts
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notifications.goalReminders"
                checked={formData.notifications?.goalReminders ?? true}
                onChange={(e) => onChange({
                  target: {
                    name: 'notifications',
                    value: {
                      ...formData.notifications,
                      goalReminders: e.target.checked
                    }
                  }
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Goal reminders
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Preferences;