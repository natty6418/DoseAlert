import { logIn } from "../services/UserHandler";
import { signInWithEmailAndPassword } from "firebase/auth";
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import SignIn from "../app/(auth)/signIn";
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
jest.mock('../services/UserHandler', () => ({
    logIn: jest.fn(),
    }));

describe('SignIn Component Tests', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('should render all input fields, sign-in button, and link', () => {
      const {getByTestId}=render(<SignIn />);
  
      // Check for input fields
      expect(getByTestId('email')).toBeTruthy();
      expect(getByTestId('password')).toBeTruthy();
  
      // Check for the "Sign In" button
      expect(screen.getByText('Sign In')).toBeTruthy();
    });
  
    test('should allow user to type in input fields', () => {
      const {getByTestId}=render(<SignIn />);
  
  
      fireEvent.changeText(getByTestId('email'), 'john.doe@example.com');
      fireEvent.changeText(getByTestId('password'), 'password123');
  
      expect(getByTestId('email').props.value).toBe('john.doe@example.com');
      expect(getByTestId('password').props.value).toBe('password123');
    });
  
    test('should call logIn and navigate to home on successful login', async () => {
      
          
    const {getByTestId, getByText}=render(<SignIn />);
  
  
    fireEvent.changeText(getByTestId('email'), 'john.doe@example.com');
    fireEvent.changeText(getByTestId('password'), 'password123');

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);
  
      // Wait for the async function to resolve and navigate to home
      await waitFor(() => {
        expect(logIn).toHaveBeenCalledWith('john.doe@example.com', 'password123');
        expect(router.replace).toHaveBeenCalledWith('/home');
      });
    });
  
    test('should display error modal when login fails', async () => {
      logIn.mockRejectedValueOnce(new Error('Invalid email or password')); // Mock failed login
  
    const {getByTestId, getByText}=render(<SignIn />);
  
  
    fireEvent.changeText(getByTestId('email'), 'john.doe@example.com');
    fireEvent.changeText(getByTestId('password'), 'password123');
  
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);
  
      // Wait for the error modal to appear
      await waitFor(() => {
        const errorMessage = getByText('Invalid email or password');
        expect(errorMessage).toBeTruthy();
      });
    });
  
    test('should close error modal and reset form on close', async () => {
      logIn.mockRejectedValueOnce(new Error('Invalid email or password')); // Mock failed login
  
      const {getByTestId, getByText}=render(<SignIn />);
  
  
      fireEvent.changeText(getByTestId('email'), 'john.doe@example.com');
      fireEvent.changeText(getByTestId('password'), 'password123');
  
  
      const signInButton = getByText('Sign In');
      fireEvent.press(signInButton);
  
      // Wait for the error modal to appear
      await waitFor(() => {
        expect(getByText('Invalid email or password')).toBeTruthy();
      });
  
      // Close the error modal
      const closeButton = getByText('OK'); // Assuming there's a close button with text "Close" in the ErrorModal
      fireEvent.press(closeButton);
  
      await waitFor(() => {
        expect(screen.queryByText('Invalid email or password')).toBeNull(); // Error modal should no longer be visible
      });
  
      // Check if form fields are reset
      expect(getByTestId('email').props.value).toBe('');
      expect(getByTestId('password').props.value).toBe('');
    });
  });
  