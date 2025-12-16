import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

// Pages
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import IncomePage from './pages/IncomePage.jsx'
import ExpensePage from './pages/ExpensePage.jsx'
import GoalsPage from './pages/GoalsPage.jsx'
import GoogleAuthHandler from './components/auth/GoogleAuthHandler.jsx'

function App () {
  return (
    <Router>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <div className='min-h-screen bg-gray-50'>
            <Toaster
              position='top-right'
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff'
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#10b981'
                  }
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#ef4444'
                  }
                }
              }}
            />
            <Routes>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/signup' element={<SignupPage />} />
              <Route
                path='/onboarding'
                element={
                  <ProtectedRoute>
                    <OnboardingPage />
                  </ProtectedRoute>
                }
              />

              {/* DASHBOARD ROUTES */}
              <Route
                path='/dashboard'
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/income'
                element={
                  <ProtectedRoute>
                    <IncomePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/expense'
                element={
                  <ProtectedRoute>
                    <ExpensePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/goals'
                element={
                  <ProtectedRoute>
                    <GoalsPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/profile'
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route path='/' element={<Navigate to='/dashboard' />} />
              // Add this route to your App.jsx
              <Route path='/auth/google/callback' element={<GoogleAuthHandler />} />
            </Routes>
          </div>
        </AuthProvider>
      </GoogleOAuthProvider>
    </Router>
  )
}

export default App
