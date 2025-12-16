import api from './api';

export const authService = {
  // Generate OTP
  generateOTP: async (email) => {
    return await api.post('/auth/generateotp', { email });
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    return await api.post('/auth/verify-otp', { email, otp });
  },

  // Signup with basic info
  signup: async (userData) => {
    return await api.post('/auth/createuser', userData);
  },

  // Login
  login: async (identifier, password) => {
    return await api.post('/auth/login', { identifier, password });
  },

  // Google Auth
  googleAuth: async (token) => {
    return await api.post('/auth/google-auth', { token });
  },

  // Complete onboarding
  completeOnboarding: async (onboardingData) => {
    return await api.post('/auth/complete-onboarding', onboardingData);
  },

  // Get onboarding status
  getOnboardingStatus: async () => {
    return await api.get('/auth/onboarding-status');
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    return await api.post('/auth/request-reset-password', { email });
  },

  // Reset password
  resetPassword: async (email, token, password) => {
    return await api.post('/auth/reset-password', { email, token, password });
  },

  // Get user profile
  getProfile: async () => {
    return await api.get('/auth/profile');
  },

  // Update profile
  updateProfile: async (profileData) => {
    return await api.put('/auth/update-profile', profileData);
  },
};

export default authService;