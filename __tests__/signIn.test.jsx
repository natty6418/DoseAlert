import { logIn } from "../services/UserHandler";
import { signInWithEmailAndPassword } from "firebase/auth";
// Mock dependencies
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock('../services/firebaseConfig', () => ({
  db: jest.fn(),
  auth: jest.fn().mockReturnValue({}),
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

  // LogIn function validation tests
  test('should throw error for invalid email format', async () => {
    const invalidEmail = 'invalid-email';
    const password = 'validPassword123';

    await expect(logIn(invalidEmail, password)).rejects.toThrow('Invalid email format');
  });

  test('should throw error for short password', async () => {
    const email = 'test@example.com';
    const shortPassword = '12345';

    await expect(logIn(email, shortPassword)).rejects.toThrow('Password must be at least 8 characters long');
  });

  test('should call signInWithEmailAndPassword for valid email and password', async () => {
    const email = 'test@example.com';
    const password = 'validPassword123';

    // Mock successful authentication
    signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'test-uid' },
    });

    const result = await logIn(email, password);
    expect(result).toBe('test-uid');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.any(Function), email, password);
  });

  test('should throw error if authentication fails', async () => {
    const email = 'test@example.com';
    const password = 'validPassword123';

    // Mock failed authentication
    signInWithEmailAndPassword.mockRejectedValue(new Error('Firebase error'));

    await expect(logIn(email, password)).rejects.toThrow('Invalid email or password');
  });
});

