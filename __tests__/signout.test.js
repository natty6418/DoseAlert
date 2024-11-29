import React from "react";
import { render, fireEvent, screen } from '@testing-library/react-native';
import SignOutPage from "../app/(auth)/signout";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import { useFirebaseContext } from "../contexts/FirebaseContext";

jest.mock('../contexts/FirebaseContext', ()=>({
    useFirebaseContext: jest.fn()
}))
jest.mock('../services/firebaseConfig', () => ({
    db: jest.fn(),
    auth: jest.fn().mockReturnValue({}),
}));
jest.mock('firebase/auth', () => ({
    signOut: jest.fn(),
  }));
  
  jest.mock("expo-router", () => ({
    router: {
      replace: jest.fn(),
    },
  }));
  
  describe('SignOut Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useFirebaseContext.mockReturnValue({
        setIsLoggedIn: jest.fn(),
        setUser: jest.fn(),
      });
    });
  
    test('should render sign out button', () => {
      const { getByText } = render(<SignOutPage />);
      const signOutButton = getByText('Sign Out');
  
      expect(signOutButton).toBeTruthy();
    });
  
    test('should call handleSignOut on button press', () => {
      const { getByText } = render(<SignOutPage />);
      const signOutButton = getByText('Sign Out');
  
      fireEvent.press(signOutButton);
  
      // Check if setUser, setIsLoggedIn, signOut, and router.replace are called correctly
      const { setIsLoggedIn, setUser } = useFirebaseContext();
  
      expect(setUser).toHaveBeenCalledWith(null);
      expect(signOut).toHaveBeenCalledWith(expect.any(Function));
      expect(setIsLoggedIn).toHaveBeenCalledWith(false);
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });