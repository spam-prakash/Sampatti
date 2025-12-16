import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [authInitialized, setAuthInitialized] = useState(false)

  // Helper function to get storage based on token type
  const getStorage = useCallback(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    return token === localStorage.getItem('authToken') ? localStorage : sessionStorage
  }, [])

  // Clear all auth storage
  const clearAuthStorage = useCallback(() => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    localStorage.removeItem('authType')
    sessionStorage.removeItem('authToken')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('authType')
    setUser(null)
    setToken(null)
  }, [])

  // Handle Google OAuth redirect callback
  useEffect(() => {
    const handleGoogleAuthRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('token')
      const userParam = urlParams.get('user')
      const error = urlParams.get('error')

      if (error) {
        toast.error(`Google login failed: ${decodeURIComponent(error)}`)
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (token && userParam) {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam))
          localStorage.setItem('authToken', token)
          localStorage.setItem('user', JSON.stringify(userData))
          localStorage.setItem('authType', 'google')
          setUser(userData)
          setToken(token)
          toast.success('Google login successful!')
          window.history.replaceState({}, document.title, window.location.pathname)
        } catch (error) {
          console.error('Failed to process Google auth:', error)
          toast.error('Failed to process Google login')
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }

    // Check on mount and whenever URL changes
    handleGoogleAuthRedirect()
  }, [])
  // Initialize auth from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing auth token
        const storedToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')

        if (storedToken && storedUser) {
          try {
            // Verify token with backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/verify-token`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${storedToken}`
              }
            })

            if (response.ok) {
              const userData = JSON.parse(storedUser)
              setUser(userData)
              setToken(storedToken)

              // Update user data from server if needed
              if (response.status === 200) {
                const freshUserData = await response.json()
                if (freshUserData.user) {
                  setUser(freshUserData.user)
                  getStorage().setItem('user', JSON.stringify(freshUserData.user))
                }
              }
            } else {
              // Token is invalid, clear storage
              clearAuthStorage()
              toast.error('Session expired. Please login again.')
            }
          } catch (error) {
            console.warn('Token verification failed, using stored user:', error)
            // Use stored user for offline access
            setUser(JSON.parse(storedUser))
            setToken(storedToken)
          }
        }

        setLoading(false)
        setAuthInitialized(true)
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearAuthStorage()
        setLoading(false)
        setAuthInitialized(true)
      }
    }

    initializeAuth()
  }, [clearAuthStorage, getStorage])

  // Handle Google authentication callback
  const handleGoogleCallback = async (googleToken) => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: googleToken })
      })

      const data = await response.json()

      if (data.success && data.authToken && data.user) {
        // Store auth info (always use localStorage for Google auth for better UX)
        localStorage.setItem('authToken', data.authToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('authType', 'google')

        setUser(data.user)
        setToken(data.authToken)

        toast.success('Google login successful!')

        return {
          success: true,
          requiresOnboarding: data.requiresOnboarding || !data.user.onboardingComplete,
          user: data.user
        }
      } else {
        toast.error(data.error || 'Google authentication failed')
        return {
          success: false,
          error: data.error || 'Authentication failed'
        }
      }
    } catch (error) {
      console.error('Google auth error:', error)
      toast.error('Network error during Google login')
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    } finally {
      setLoading(false)
    }
  }

  // Initiate Google OAuth flow (same window)
  const initiateGoogleLogin = () => {
    // Store current page for redirect back after login
    sessionStorage.setItem('preAuthRoute', window.location.pathname)

    // Redirect to backend Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`
  }

  // Regular login
  const login = async (identifier, password, remember = true) => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      })

      const data = await response.json()

      if (data.success && data.authToken && data.user) {
        const storage = remember ? localStorage : sessionStorage
        storage.setItem('authToken', data.authToken)
        storage.setItem('user', JSON.stringify(data.user))
        storage.setItem('authType', 'email')

        setUser(data.user)
        setToken(data.authToken)

        toast.success('Login successful!')

        return {
          success: true,
          requiresOnboarding: !data.user.onboardingComplete,
          user: data.user
        }
      } else {
        toast.error(data.error || 'Invalid credentials')
        return {
          success: false,
          error: data.error || 'Login failed. Please check your credentials.'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Network error. Please check your connection.')
      return {
        success: false,
        error: 'Network error. Please check your internet connection.'
      }
    } finally {
      setLoading(false)
    }
  }

  // Signup
  const signup = async (userData, remember = true) => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (data.success && data.authToken && data.user) {
        const storage = remember ? localStorage : sessionStorage
        storage.setItem('authToken', data.authToken)
        storage.setItem('user', JSON.stringify(data.user))
        storage.setItem('authType', 'email')

        setUser(data.user)
        setToken(data.authToken)

        toast.success('Account created successfully!')

        return {
          success: true,
          requiresOnboarding: true,
          user: data.user
        }
      } else {
        toast.error(data.error || 'Signup failed')
        return {
          success: false,
          error: data.error || 'Signup failed. Please try again.'
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Network error. Please check your connection.')
      return {
        success: false,
        error: 'Network error. Please check your internet connection.'
      }
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = () => {
    // Call logout API to invalidate token on server
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).catch(console.error)
    }

    clearAuthStorage()
    toast.success('Logged out successfully')
  }

  // Update user data
  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    const storage = getStorage()
    storage.setItem('user', JSON.stringify(updatedUser))
  }

  // Refresh user data from server
  const refreshUser = async () => {
    if (!token) return null

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          getStorage().setItem('user', JSON.stringify(data.user))
          return data.user
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
    return null
  }

  // API call wrapper with auth header
  const authFetch = useCallback(async (url, options = {}) => {
    const headers = {
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    }

    const response = await fetch(url, { ...options, headers })

    // Handle token expiration
    if (response.status === 401) {
      clearAuthStorage()
      toast.error('Session expired. Please login again.')
      throw new Error('Session expired')
    }

    return response
  }, [token, clearAuthStorage])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        authInitialized,
        login,
        signup,
        initiateGoogleLogin,
        handleGoogleCallback,
        logout,
        updateUser,
        refreshUser,
        authFetch,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
