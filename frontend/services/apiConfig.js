// API Configuration for local SQLite database
// This file maintains the API structure for local database operations

// Local database configuration
export const DATABASE_CONFIG = {
  name: 'dosealert.db'
};

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