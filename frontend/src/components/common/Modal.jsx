import React from 'react'
import { FaTimes } from 'react-icons/fa'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size] || sizeClasses.md} w-full mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        {title && (
          <div className='flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white'>
            <h2 className='text-xl font-semibold text-gray-900'>{title}</h2>
            <button
              onClick={onClose}
              className='text-gray-500 hover:text-gray-700 transition-colors'
              aria-label='Close modal'
            >
              <FaTimes className='w-5 h-5' />
            </button>
          </div>
        )}

        {/* Body */}
        <div className='px-6 py-4'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
