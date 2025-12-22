import React from 'react'

const Loader = ({ size = 'md', color = 'blue', fullScreen = false }) => {
  // Mapping sizes for better scaling across devices
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-14 h-14 md:w-16 md:h-16 border-4'
  };

  // Dynamic color mapping for versatility
  const colorClasses = {
    blue: 'border-t-blue-600',
    white: 'border-t-white',
    purple: 'border-t-purple-600'
  };

  const loader = (
    <div
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        animate-spin 
        rounded-full 
        border-gray-200/60
      `}
    />
  )

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-[9999]'>
        {loader}
        {/* Optional: Add "Loading..." text for accessibility on mobile */}
        <span className='mt-4 text-sm font-medium text-gray-500 animate-pulse'>
          Loading...
        </span>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center p-2'>
      {loader}
    </div>
  )
};

export default Loader
