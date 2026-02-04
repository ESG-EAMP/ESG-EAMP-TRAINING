import axios from 'axios';

// Token storage utilities - using sessionStorage for better security (cleared on tab close)
// Falls back to localStorage for persistence if needed
const TOKEN_KEY = 'token';
const TOKEN_STORAGE = 'sessionStorage'; // 'localStorage' or 'sessionStorage'

/**
 * Get token from storage
 * @returns {string|null} The authentication token or null
 */
export const getToken = () => {
  try {
    if (TOKEN_STORAGE === 'sessionStorage') {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    }
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Set token in storage
 * @param {string} token - The authentication token
 */
export const setToken = (token) => {
  try {
    if (TOKEN_STORAGE === 'sessionStorage') {
      sessionStorage.setItem(TOKEN_KEY, token);
      // Also store in localStorage as backup
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('Error setting token:', error);
  }
};

/**
 * Remove token from storage
 */
export const removeToken = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

/**
 * Clear all authentication data and redirect to login
 * This function is called automatically when a 401 error is detected
 */
const forceLogout = () => {
  try {
    // Get user role before clearing storage
    const userRole = sessionStorage.getItem('user_role');
    const currentPath = window.location.pathname;
    
    // Check if we're on the API Tester page - don't redirect, let it handle the error
    const isApiTesterPage = currentPath.includes('/api-tester');
    if (isApiTesterPage) {
      return; // Don't logout on API tester page
    }
    
    // Check if we're already on a login page - don't redirect again
    const isLoginPage = currentPath.includes('/login') || 
                       currentPath.includes('/admin/login') ||
                       currentPath === '/';
    if (isLoginPage) {
      // Still clear the token even if on login page
      removeToken();
      sessionStorage.removeItem('user_role');
      localStorage.removeItem('admin_access_level');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_email');
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');
      return;
    }
    
    // Clear all authentication data
    removeToken();
    sessionStorage.removeItem('user_role');
    localStorage.removeItem('admin_access_level');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('user');
    localStorage.removeItem('user_id');
    
    // Note: No need to clear user permissions cache here since we're doing a full page redirect
    // which will destroy the entire JavaScript context and clear all in-memory caches
    
    // Determine redirect path based on user role or current path
    const isAdminRoute = currentPath.startsWith('/admin');
    const redirectPath = (userRole === 'admin' || userRole === 'super_admin' || isAdminRoute) 
      ? '/admin/login' 
      : '/login';
    
    // Redirect to login page
    window.location.replace(redirectPath);
  } catch (error) {
    console.error('Error during force logout:', error);
    // Fallback: clear everything and redirect to user login
    removeToken();
    localStorage.clear();
    sessionStorage.clear();
    // Note: No need to clear user permissions cache here since we're doing a full page redirect
    window.location.replace('/login');
  }
};

/**
 * Check if token exists and is not empty
 * @returns {boolean} True if token exists
 */
export const hasToken = () => {
  const token = getToken();
  return token !== null && token !== undefined && token !== '' && token !== 'undefined';
};

/**
 * Validate token format (basic check)
 * @param {string} token - The token to validate
 * @returns {boolean} True if token format is valid
 */
const isValidTokenFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  // Basic validation - token should not be empty and should have some length
  return token.trim().length > 0;
};

// Create a centralized axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    // Get token using the utility function
    const token = getToken();
    
    // Only add Authorization header if token exists and is valid
    if (token && isValidTokenFormat(token)) {
      // Ensure headers object exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't add Authorization header if token is invalid/missing
    // This allows public endpoints to work without tokens
    
    return config;
  },
  (error) => {
    // Handle request error
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Success response - just return it
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) and 403 (Forbidden) errors
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        // Prevent infinite redirect loops
        if (!originalRequest._retry) {
          originalRequest._retry = true;
          
          // Automatically log out user when session expires or is invalid
          console.warn('Session expired or invalid (401/403). Logging out user...');
          forceLogout();
        }
      }
    } else if (!error.response) {
      // Network error or timeout
      console.error('Network error or timeout:', error.message);
    }

    return Promise.reject(error);
  }
);

// Export the configured axios instance
export default api;

// Export API base URL for cases where full URL is needed (e.g., image URLs)
export const API_BASE = import.meta.env.VITE_APP_API;

// Export token utilities for use in components if needed
// Note: getToken, setToken, removeToken, and hasToken are already exported individually above

