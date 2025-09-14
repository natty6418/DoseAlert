import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from 'prop-types';
import { refreshAccessToken } from '../services/UserHandler';
import { migrateGuestDataToUser, hasGuestDataToMigrate } from '../services/GuestMigration';
import { completePostAuthMigration } from '../services/PostAuthMigration';

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
  const [isGuest, setIsGuest] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Get a valid access token, refreshing if necessary
  const getValidAccessToken = async () => {
    if (isGuest) {
      throw new Error('Operation not available for guest users');
    }
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
      const storedGuestStatus = await AsyncStorage.getItem('isGuest');
      console.log(
        'Loaded auth state from storage:',
        { storedAccessToken, storedRefreshToken, storedUser, storedGuestStatus }
      );
      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setIsGuest(false);
      } else if (storedGuestStatus === 'true') {
        // Set a default guest user object with ID 1
        const guestUser = { id: 1, username: 'guest', email: 'guest@local' };
        setUser(guestUser);
        setIsGuest(true);
      } else {
        // No stored auth data, user needs to make a choice - stay on landing page
        setIsGuest(false);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      }
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading stored tokens:', error);
      setHasInitialized(true);
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
      console.log("Clearing Tokens...");
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'isGuest']);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  };

  const loginAsGuest = async () => {
    try {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      await AsyncStorage.setItem('isGuest', 'true');
      setAccessToken(null);
      setRefreshToken(null);
      // Set a default guest user object with ID 1
      const guestUser = { id: 1, username: 'guest', email: 'guest@local' };
      setUser(guestUser);
      setIsGuest(true);
    } catch (error) {
      console.error('Error setting guest status:', error);
    }
  };

  const upgradeFromGuest = async (tokens, userData) => {
    try {
      console.log('🔄 Upgrading guest user to authenticated user...');
      
      // Check if there's guest data to migrate
      const guestDataInfo = await hasGuestDataToMigrate();
      
      if (guestDataInfo.hasData) {
        console.log(`📦 Found ${guestDataInfo.medicationCount} guest medications to migrate`);
        
        // Migrate guest data to the new user ID
        const migrationResult = await migrateGuestDataToUser(userData.id);
        
        console.log('✅ Guest data migration completed:', migrationResult);
        
        // Complete the migration by syncing to backend
        console.log('🔄 Starting post-migration sync...');
        setTimeout(async () => {
          try {
            const postMigrationResult = await completePostAuthMigration(userData.id);
            console.log('📋 Post-migration sync result:', postMigrationResult);
          } catch (error) {
            console.error('❌ Post-migration sync failed:', error);
          }
        }, 2000); // Delay to allow UI to settle
        
      } else {
        console.log('ℹ️ No guest data found to migrate');
      }
      
      // Remove guest status and store authenticated user data
      await AsyncStorage.removeItem('isGuest');
      setIsGuest(false);
      await storeTokens(tokens, userData);
      
      console.log('🎉 Successfully upgraded from guest to authenticated user');
      
    } catch (error) {
      console.error('❌ Error upgrading from guest:', error);
      // If migration fails, still proceed with authentication but log the error
      await AsyncStorage.removeItem('isGuest');
      setIsGuest(false);
      await storeTokens(tokens, userData);
      
      // Optionally show a warning to user that some data may need to be re-entered
      console.warn('⚠️ Guest data migration failed, but user authentication succeeded');
    }
  };

  const isAuthenticated = () => {
    return !!accessToken || isGuest;
  };

  const hasUserMadeChoice = () => {
    return hasInitialized && (!!accessToken || isGuest);
  };

  const isLoggedIn = () => {
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
    isGuest,
    storeTokens,
    clearTokens,
    isAuthenticated,
    hasUserMadeChoice,
    isLoggedIn,
    setUser,
    getValidAccessToken,
    makeAuthenticatedRequest,
    refreshAuthState,
    loginAsGuest,
    upgradeFromGuest,
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