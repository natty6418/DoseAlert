// UserHandler.js
// Handles user authentication and profile logic using Django backend API

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8000/api';

// Register a new user
export async function registerUser(userData) {
  const res = await fetch(`${BASE_URL}/users/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const response = await res.json();
  
  // Automatically store tokens if registration includes login
  if (response.access && response.refresh) {
    await AsyncStorage.setItem('accessToken', response.access);
    await AsyncStorage.setItem('refreshToken', response.refresh);
    if (response.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }
  }
  
  return response;
}

// Alias for registerUser for backward compatibility
export async function createNewAccount(email, password, firstName, lastName) {
  const userData = {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  };
  return registerUser(userData);
}

// Login user
export async function loginUser(username, password) {
  const res = await fetch(`${BASE_URL}/users/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const response = await res.json();
  
  // Automatically store tokens
  if (response.access && response.refresh) {
    await AsyncStorage.setItem('accessToken', response.access);
    await AsyncStorage.setItem('refreshToken', response.refresh);
    if (response.user) {
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }
  }
  
  return response;
}

// Logout user (blacklist refresh token) with automatic token refresh
export async function logoutUser(makeAuthenticatedRequest, refreshToken) {
  if (!makeAuthenticatedRequest) {
    throw new Error('makeAuthenticatedRequest function is required');
  }
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/users/logout/`, {
    method: 'POST',
    body: JSON.stringify({ refresh: refreshToken }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get user profile with automatic token refresh
export async function getUserProfile(makeAuthenticatedRequest) {
  if (!makeAuthenticatedRequest) {
    throw new Error('makeAuthenticatedRequest function is required');
  }
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/users/profile/`);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Update user profile with automatic token refresh
export async function updateUserProfile(makeAuthenticatedRequest, updates) {
  if (!makeAuthenticatedRequest) {
    throw new Error('makeAuthenticatedRequest function is required');
  }
  
  const res = await makeAuthenticatedRequest(`${BASE_URL}/users/profile/`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// JWT Token refresh
export async function refreshAccessToken(refreshToken) {
  const storedRefreshToken = refreshToken || await AsyncStorage.getItem('refreshToken');
  
  if (!storedRefreshToken) {
    throw new Error('No refresh token available');
  }
  
  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: storedRefreshToken }),
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  
  const data = await res.json();
  
  // Store the new access token if provided
  if (data.access) {
    await AsyncStorage.setItem('accessToken', data.access);
  }
  
  return data;
}

