/* global jest, describe, beforeEach, test, expect */

import React from "react";
import { render, fireEvent } from '@testing-library/react-native';
import SignOutPage from "../app/(auth)/signout";
import { logoutUser } from "../services/UserHandler";
import { useAuth } from "../contexts/AuthContext";

// Mock dependencies
jest.mock("../services/UserHandler", () => ({
  logoutUser: jest.fn(),
}));

jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));
  
describe('SignOut Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthContext
    useAuth.mockReturnValue({
      refreshToken: 'mock-refresh-token',
      clearTokens: jest.fn(),
      makeAuthenticatedRequest: jest.fn(),
    });
  });
  
    test('should render sign out button', () => {
      const { getByText } = render(<SignOutPage />);
      const signOutButton = getByText('Sign Out');
  
      expect(signOutButton).toBeTruthy();
    });
  
    test('should call handleSignOut on button press', async () => {
      const mockClearTokens = jest.fn();
      
      useAuth.mockReturnValue({
        refreshToken: 'mock-refresh-token',
        clearTokens: mockClearTokens,
        makeAuthenticatedRequest: jest.fn(),
      });

      const { getByText } = render(<SignOutPage />);
      const signOutButton = getByText('Sign Out');

      fireEvent.press(signOutButton);

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if clearTokens and logoutUser are called correctly  
      expect(mockClearTokens).toHaveBeenCalled();
      expect(logoutUser).toHaveBeenCalled();
    });
  });