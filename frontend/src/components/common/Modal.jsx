import React, { useEffect } from 'react'
import { FaTimes } from 'react-icons/fa'

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '2xl': 'md:max-w-2xl'
  }

  return (
    <div className='fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4'>
      {/* Backdrop with Blur */}
      <div
        className='fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300'
        onClick={onClose}
        aria-hidden='true'
      />

      {/* Modal Content */}
      <div
        className={`
          relative bg-white shadow-2xl w-full
          /* Mobile: Rounded top only + slide up */
          rounded-t-2xl sm:rounded-2xl 
          animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300
          ${sizeClasses[size] || sizeClasses.md} 
          /* Height constraints */
          max-h-[92dvh] sm:max-h-[90vh] 
          flex flex-col overflow-hidden
        `}
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-white shrink-0'>
          <h2 className='text-lg md:text-xl font-bold text-gray-900 truncate pr-4'>
            {title || 'Notification'}
          </h2>
          <button
            onClick={onClose}
            className='p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all'
            aria-label='Close modal'
          >
            <FaTimes className='w-5 h-5' />
          </button>
        </div>

        {/* Body (Scrollable area) */}
        <div className='px-5 py-5 overflow-y-auto text-sm md:text-base text-gray-600 custom-scrollbar'>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
