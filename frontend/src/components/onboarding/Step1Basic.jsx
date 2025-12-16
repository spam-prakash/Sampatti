import React from 'react';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';

const Step1Basic = ({ formData, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Personal Information
        </h3>
        <p className="text-gray-600">
          Tell us a bit about yourself. This helps us personalize your experience.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={onChange}
              className="input-field pl-10"
              placeholder="John Doe"
              required
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaEnvelope className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={onChange}
              className="input-field pl-10"
              placeholder="you@example.com"
              required
              disabled
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Email cannot be changed
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaPhone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone || ''}
              onChange={onChange}
              className="input-field pl-10"
              placeholder="9876543210"
              pattern="[0-9]{10}"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Optional - for important updates
          </p>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step1Basic;