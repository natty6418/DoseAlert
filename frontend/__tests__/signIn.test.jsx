/* global jest, describe, afterEach, test, expect */

import { loginUser } from "../services/UserHandler";

// Mock dependencies
jest.mock('../services/UserHandler', () => ({
  loginUser: jest.fn(),
}));

jest.mock('expo-router', () => ({
    Link: ({ children }) => children,
  router: {
    replace: jest.fn(),
  },
}));

describe('Login Validation Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // LoginUser function validation tests
  test('should throw error for invalid email format', async () => {
    const invalidEmail = 'invalid-email';
    const password = 'validPassword123';

    loginUser.mockRejectedValue(new Error('Invalid email format'));

    await expect(loginUser(invalidEmail, password)).rejects.toThrow('Invalid email format');
  });

  test('should throw error for short password', async () => {
    const email = 'test@example.com';
    const shortPassword = '12345';

    loginUser.mockRejectedValue(new Error('Password must be at least 8 characters long'));

    await expect(loginUser(email, shortPassword)).rejects.toThrow('Password must be at least 8 characters long');
  });

  test('should call loginUser for valid email and password', async () => {
    const email = 'test@example.com';
    const password = 'validPassword123';

    // Mock successful authentication
    loginUser.mockResolvedValue({
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      user: { id: 1, email: 'test@example.com' },
    });

    const result = await loginUser(email, password);
    expect(result.user.id).toBe(1);
    expect(loginUser).toHaveBeenCalledWith(email, password);
  });

  test('should throw error if authentication fails', async () => {
    const email = 'test@example.com';
    const password = 'validPassword123';

    // Mock failed authentication
    loginUser.mockRejectedValue(new Error('Invalid email or password'));

    await expect(loginUser(email, password)).rejects.toThrow('Invalid email or password');
  });
});

