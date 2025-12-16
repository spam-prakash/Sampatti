import React from 'react';

const Loader = ({ size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const loader = (
    <div className={`loader rounded-full ${sizeClasses[size]} border-gray-200 border-t-primary-500`}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-50">
        {loader}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      {loader}
    </div>
  );
};

export default Loader;