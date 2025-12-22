import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Loader from './Loader'

/**
 * ProtectedRoute Logic Flow:
 * 1. Loading -> Show Fullscreen Loader
 * 2. Unauthenticated -> Redirect to /login (Save intent)
 * 3. Authenticated but incomplete profile -> Redirect to /onboarding
 * 4. Fully Authenticated -> Render children
 */

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  // 1. Handle initial auth state check
  if (loading) {
    return <Loader fullScreen color='blue' />
  }

  // 2. Redirect to login if not authenticated
  // We pass the current location in 'state' so we can redirect back after login
  if (!user) {
    return (
      <Navigate
        to='/login'
        state={{ from: location }}
        replace
      />
    )
  }

  // 3. Handle Onboarding Redirect
  // Logic: User is logged in BUT hasn't finished setup
  const isCurrentlyOnOnboarding = location.pathname === '/onboarding'
  
  if (!user.onboardingComplete && !isCurrentlyOnOnboarding) {
    return (
      <Navigate
        to='/onboarding'
        state={{ from: location }} // Optional: track where they were headed
        replace
      />
    )
  }

  // 4. Prevent "Back-to-Onboarding" for completed users
  // If they are on the onboarding page but finished it, send them to dashboard
  if (user.onboardingComplete && isCurrentlyOnOnboarding) {
    return <Navigate to='/dashboard' replace />
  }

  return children
};

export default ProtectedRoute
