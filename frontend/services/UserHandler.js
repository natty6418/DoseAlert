// UserHandler.js
// Handles user authentication and profile logic using Drizzle ORM

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase, isDatabaseInitialized, setupDatabase, users } from './database.js';
import { eq } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  if (!isDatabaseInitialized()) {
    await setupDatabase();
  }
  return getDatabase();
};

// Hash password (basic implementation - in production use bcrypt or similar)
const hashPassword = (password) => {
  // This is a placeholder - implement proper password hashing
  return btoa(password);
};

// Generate JWT token (placeholder - implement proper JWT generation)
const generateToken = (userId) => {
  const payload = {
    userId,
    timestamp: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };
  return btoa(JSON.stringify(payload));
};

// Register a new user
export async function registerUser(userData) {
  try {
    const db = await ensureDbInitialized();
    
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, userData.email));
    
    if (existingUser.length > 0) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const hashedPassword = hashPassword(userData.password);
    const result = await db.insert(users).values({
      email: userData.email,
      username: userData.username,
      password: hashedPassword
    }).returning({
      id: users.id,
      email: users.email,
      username: users.username,
      createdAt: users.createdAt
    });
    
    const newUser = result[0];
    
    // Generate tokens
    const accessToken = generateToken(newUser.id);
    const refreshToken = generateToken(newUser.id + '_refresh');
    
    // Store tokens locally
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    }));
    
    return {
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      }
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
    username: firstName + ' ' + lastName, // Combine first and last name as username
  };
  return registerUser(userData);
}

// Login user
export async function loginUser(username, password) {
  try {
    const db = await ensureDbInitialized();
    
    // Find user by email or username
    const userResults = await db.select()
      .from(users)
      .where(eq(users.email, username));
    
    // If no user found by email, try username
    let user = userResults[0];
    if (!user) {
      const usernameResults = await db.select()
        .from(users)
        .where(eq(users.username, username));
      user = usernameResults[0];
    }
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const hashedInputPassword = hashPassword(password);
    if (hashedInputPassword !== user.password) {
      throw new Error('Invalid credentials');
    }
    
    // Generate tokens
    const accessToken = generateToken(user.id);
    const refreshToken = generateToken(user.id + '_refresh');
    
    // Store tokens locally
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      username: user.username,
    }));
    
    return {
      access: accessToken,
      refresh: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      }
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw new Error(`Login failed: ${error.message}`);
  }
}

// Logout user (clear local storage)
export async function logoutUser() {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    return { success: true };
  } catch (error) {
    console.error('Error logging out user:', error);
    throw new Error(`Logout failed: ${error.message}`);
  }
}

// Get user profile
export async function getUserProfile(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const user = await db.getFirstAsync(
      'SELECT id, email, username, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.created_at,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

// Update user profile
export async function updateUserProfile(userId, updates) {
  try {
    const db = await ensureDbInitialized();
    
    await db.runAsync(
      'UPDATE users SET email = ?, username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updates.email, updates.username, userId]
    );
    
    // Get the updated user
    const updatedUser = await db.getFirstAsync(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );
    
    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

// JWT Token refresh (local implementation)
export async function refreshAccessToken(userId) {
  try {
    const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }
    
    // Generate new access token
    const newAccessToken = generateToken(userId);
    
    // Store the new access token
    await AsyncStorage.setItem('accessToken', newAccessToken);
    
    return { access: newAccessToken };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

