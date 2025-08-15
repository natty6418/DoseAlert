import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import { refreshAccessToken } from '../services/UserHandler';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token expires within the next 5 minutes (300 seconds)
    return payload.exp < (currentTime + 300);
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get a valid access token, refreshing if necessary
  const getValidAccessToken = async () => {
    if (!accessToken || !refreshToken) {
      throw new Error('No tokens available');
    }

    // Check if token is expired or will expire soon
    if (isTokenExpired(accessToken)) {
      if (isRefreshing) {
        // If already refreshing, wait a bit and return current token
        await new Promise(resolve => setTimeout(resolve, 1000));
        return accessToken;
      }

      try {
        setIsRefreshing(true);
        console.log('Token expired, refreshing...');
        
        const response = await refreshAccessToken(refreshToken);
        
        if (response.access) {
          setAccessToken(response.access);
          await AsyncStorage.setItem('accessToken', response.access);
          return response.access;
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear tokens and force re-login
        await clearTokens();
        throw new Error('Authentication expired. Please log in again.');
      } finally {
        setIsRefreshing(false);
      }
    }

    return accessToken;
  };

  // Make an authenticated API request with automatic token refresh
  const makeAuthenticatedRequest = async (url, options = {}) => {
    try {
      const validToken = await getValidAccessToken();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${validToken}`,
          ...options.headers,
        },
      });

      // If we get 401, the token might be invalid, try one more time
      if (response.status === 401 && !isRefreshing) {
        try {
          const newToken = await getValidAccessToken();
          return fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
              ...options.headers,
            },
          });
        } catch (refreshError) {
          console.error('Failed to refresh token on 401:', refreshError);
          await clearTokens();
          throw new Error('Authentication expired. Please log in again.');
        }
      }

      return response;
    } catch (error) {
      console.error('Authenticated request failed:', error);
      throw error;
    }
  };

  // Load stored tokens on app start
  useEffect(() => {
    loadStoredTokens();
  }, []);

  const loadStoredTokens = async () => {
    try {
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error('Error loading stored tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const storeTokens = async (tokens, userData = null) => {
    try {
      await AsyncStorage.setItem('accessToken', tokens.access);
      await AsyncStorage.setItem('refreshToken', tokens.refresh);
      if (userData) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
      
      setAccessToken(tokens.access);
      setRefreshToken(tokens.refresh);
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  };

  const clearTokens = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  };

  const isAuthenticated = () => {
    return !!accessToken;
  };

  // Refresh auth state from storage (useful after external login)
  const refreshAuthState = async () => {
    await loadStoredTokens();
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    loading,
    storeTokens,
    clearTokens,
    isAuthenticated,
    setUser,
    getValidAccessToken,
    makeAuthenticatedRequest,
    refreshAuthState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;