// API Configuration for local SQLite database and HTTP requests
// This file maintains the API structure for local database operations and axios configuration

import axios from 'axios';

// Local database configuration
export const DATABASE_CONFIG = {
  name: 'dosealert.db'
};

// Backend URL configuration
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Create axios instance with default configuration
export const apiClient = axios.create({
  baseURL: BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

// Process failed requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error adding auth token to request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (expired token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Import refreshAccessToken function dynamically to avoid circular imports
        const { refreshAccessToken } = await import('./UserHandler.js');
        const tokenResponse = await refreshAccessToken(refreshToken);
        
        // Update the stored access token
        await AsyncStorage.setItem('accessToken', tokenResponse.access);
        
        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${tokenResponse.access}`;
        
        // Process queued requests
        processQueue(null, tokenResponse.access);
        
        // Retry the original request
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear all tokens and redirect to login
        await clearAuthData();
        
        // Process queued requests with error
        processQueue(refreshError, null);
        
        // Set user-friendly error message
        error.userMessage = 'Session expired. Please log in again.';
        return Promise.reject(error);
        
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      console.error(`API Error ${status}:`, data);
      
      // Extract user-friendly error message
      const errorMessage = data?.detail || data?.message || data?.error || `Request failed with status ${status}`;
      error.userMessage = errorMessage;
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error:', error.message);
      error.userMessage = 'Network error - please check your connection';
    } else {
      // Something else happened
      console.error('Request setup error:', error.message);
      error.userMessage = error.message;
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get current user ID from local storage
export const getCurrentUserId = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user).id : null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

// Helper function to get stored access token
export const getStoredAccessToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting stored access token:', error);
    return null;
  }
};

// Helper function to check if token is expired (basic JWT decode)
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // Decode JWT payload (without verification)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is actually expired (not just expiring soon)
    // Only refresh if token is already expired or expires within 1 minute
    return payload.exp < (currentTime + 60);
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false; // Don't assume expired if we can't decode - let the server decide
  }
};

// Helper function to clear all authentication data
export const clearAuthData = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    console.log('Authentication data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};