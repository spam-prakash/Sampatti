import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'

const Toast = () => {
  const [isMobile, setIsMobile] = useState(false)

  // Track window width to adjust toast position dynamically
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Toaster
      // Position center for mobile, top-right for desktop
      position={isMobile ? 'top-center' : 'top-right'}
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        // Adjust vertical offset for mobile headers (usually smaller) vs desktop
        top: isMobile ? 20 : 72,
        left: 16,
        right: 16,
        bottom: 20
      }}
      toastOptions={{
        duration: 4000,
        // Modern, high-contrast styles
        style: {
          background: '#1f2937', // Tailwind Gray-800
          color: '#f9fafb', // Tailwind Gray-50
          padding: '12px 20px',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          maxWidth: isMobile ? '90vw' : '400px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981', // Tailwind Emerald-500
            secondary: '#fff'
          }
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444', // Tailwind Red-500
            secondary: '#fff'
          }
        }
      }}
    />
  )
}

export default Toast
