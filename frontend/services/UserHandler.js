// UserHandler.js
// Handles user authentication via backend API and manages JWT tokens locally
// No local user accounts - all authentication happens via backend

import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
console.log("Using BACKEND_URL:", BACKEND_URL);

// Extract user-friendly error message from API response
const extractErrorMessage = (errorText) => {
  // Try to parse as JSON first, fallback to text
  let errorData;
  try {
    errorData = JSON.parse(errorText);
  } catch {
    // If not JSON, use the raw text as the error message
    return errorText || 'API request failed';
  }
  
  // Handle structured error responses (like Django validation errors)
  if (typeof errorData === 'object' && errorData !== null) {
    // Check for common error message fields
    if (errorData.detail) {
      return errorData.detail;
    }
    if (errorData.message) {
      return errorData.message;
    }
    
    // Handle field-specific validation errors (like {"password": ["This password is too common."]})
    const errorMessages = [];
    for (const [, messages] of Object.entries(errorData)) {
      if (Array.isArray(messages)) {
        errorMessages.push(...messages);
      } else if (typeof messages === 'string') {
        errorMessages.push(messages);
      }
    }
    
    if (errorMessages.length > 0) {
      return errorMessages.join('. ');
    }
  }
  
  return errorText || 'API request failed';
};

// API helper function
const makeAPIRequest = async (endpoint, options = {}) => {
  // Ensure we don't double up on /api if BACKEND_URL already includes it
  const baseUrl = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;
  const url = `${baseUrl}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`Making API request to: ${url}`);
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.log('Error response:', errorText);
    const res = await response.json()
    console.log('Error response parsed as JSON:', res.message);
    
    const userFriendlyMessage = extractErrorMessage(errorText);
    throw new Error(userFriendlyMessage);
  }

  return response.json();
};

// Register a new user via backend API
export async function registerUser(userData) {
  try {
    const response = await makeAPIRequest('/users/register/', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
        first_name: userData.firstName || '',
        last_name: userData.lastName || ''
      }),
    });

    // Store tokens and user data locally
    await AsyncStorage.setItem('accessToken', response.access);
    await AsyncStorage.setItem('refreshToken', response.refresh);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return {
      access: response.access,
      refresh: response.refresh,
      user: response.user
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Error(`Registration failed: ${error.message}`);
  }
}

// Alias for registerUser for backward compatibility
export async function createNewAccount(email, password, firstName, lastName) {
  const userData = {
    email,
    password,
    username: email, // Use email as username
    firstName,
    lastName
  };
  return registerUser(userData);
}

// Login user via backend API
export async function loginUser(username, password) {
  try {
    const response = await makeAPIRequest('/users/login/', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password
      }),
    });

    // Store tokens and user data locally
    await AsyncStorage.setItem('accessToken', response.access);
    await AsyncStorage.setItem('refreshToken', response.refresh);
    await AsyncStorage.setItem('user', JSON.stringify(response.user));

    return {
      access: response.access,
      refresh: response.refresh,
      user: response.user
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Logout user via backend API and clear local storage
export async function logoutUser() {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (refreshToken) {
      // Call backend logout to blacklist the refresh token
      await makeAPIRequest('/users/logout/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          refresh: refreshToken
        }),
      });
    }
  } catch (error) {
    console.error('Error calling backend logout:', error);
    // Continue with local cleanup even if backend call fails
  } finally {
    // Always clear local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  }
  
  return { success: true };
}

// Get user profile from backend API
export async function getUserProfile() {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await makeAPIRequest('/users/profile/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Update local user data
    await AsyncStorage.setItem('user', JSON.stringify(response));

    return response;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

// Update user profile via backend API
export async function updateUserProfile(updates) {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    const response = await makeAPIRequest('/users/profile/', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(updates)
    });

    // Update local user data
    await AsyncStorage.setItem('user', JSON.stringify(response));

    return response;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

// Refresh access token via backend API
export async function refreshAccessToken(refreshToken) {
  try {
    const storedRefreshToken = refreshToken || await AsyncStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await makeAPIRequest('/auth/refresh/', {
      method: 'POST',
      body: JSON.stringify({
        refresh: storedRefreshToken
      }),
    });

    // Store the new access token
    await AsyncStorage.setItem('accessToken', response.access);

    return { access: response.access };
  } catch (error) {
    console.error('Error refreshing token:', error);
    // If refresh fails, clear all tokens to force re-login
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

// Get stored user data from local storage
export async function getStoredUser() {
  try {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting stored user:', error);
    return null;
  }
}

// Get stored access token
export async function getStoredAccessToken() {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('Error getting stored access token:', error);
    return null;
  }
}

// Check if user is authenticated (has valid tokens)
export async function isAuthenticated() {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    return !!(accessToken && refreshToken);
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}

