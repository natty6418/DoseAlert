import { createNewAccount } from "../services/firebaseDatabase";
import {  createUserWithEmailAndPassword } from "firebase/auth";
import React from "react";
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from "expo-router";
import { useFirebaseContext } from "../contexts/FirebaseContext";
import SignUp from "../app/(auth)/signUp";
import { createNewUser } from "../services/firebaseDatabase";


jest.mock('firebase/auth', () => ({
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({user: {uid: 'test-uid'}}),
  }));
  jest.mock('../services/firebaseConfig', () => ({
    db: jest.fn(),
    auth: jest.fn().mockReturnValue({}),
}));
jest.mock('../contexts/FirebaseContext', ()=>({
    useFirebaseContext: jest.fn()
}))
jest.mock("expo-router", () => ({
    Link: ({ children }) => children,
    router: {
      replace: jest.fn(),
    },
  }));

jest.mock("../services/firebaseDatabase", () => ({
createNewAccount: jest.fn(),
createNewUser: jest.fn(),
}));

describe("SignUp Component", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test("should render all input fields and sign up button", () => {
      const {getByText} = render(<SignUp />);
  
      // Check for input fields
      expect(getByText("First Name")).toBeTruthy();
      expect(getByText("Last Name")).toBeTruthy();
      expect(getByText("Email")).toBeTruthy();
      expect(getByText("Password")).toBeTruthy();
  
      // Check for Sign Up button
      expect(screen.getByText("Sign Up")).toBeTruthy();
    });
  
    test("should allow user to type in input fields", () => {
      const {getByTestId}=render(<SignUp />);
  
      fireEvent.changeText(getByTestId("firstName"), "John");
      fireEvent.changeText(getByTestId("lastName"), "Doe");
      fireEvent.changeText(getByTestId("email"), "john.doe@example.com");
      fireEvent.changeText(getByTestId("password"), "password123");
  
      expect(getByTestId("firstName").props.value).toBe("John");
      expect(getByTestId("lastName").props.value).toBe("Doe");
      expect(getByTestId("email").props.value).toBe("john.doe@example.com");
      expect(getByTestId("password").props.value).toBe("password123");
    });
  
    test("should call createNewAccount and navigate to home on successful sign up", async () => {
      createNewAccount.mockResolvedValueOnce({
        uid: "test-uid",
      }); // Mock successful creation of account
  
      const {getByTestId, getByText}=render(<SignUp />);
  
      fireEvent.changeText(getByTestId("firstName"), "John");
      fireEvent.changeText(getByTestId("lastName"), "Doe");
      fireEvent.changeText(getByTestId("email"), "john.doe@example.com");
      fireEvent.changeText(getByTestId("password"), "password123");
  
      const signUpButton = getByText("Sign Up");
      fireEvent.press(signUpButton);
  
      await waitFor(() => {
        expect(createNewAccount).toHaveBeenCalledWith("john.doe@example.com", "password123", "John", "Doe");
        expect(router.replace).toHaveBeenCalledWith("/signIn");
      });
    });
  
    test("should display error modal when sign up fails", async () => {
      createNewAccount.mockRejectedValueOnce(new Error("Sign up failed")); // Mock failure
  
      const {getByTestId, getByText}=render(<SignUp />);
  
      fireEvent.changeText(getByTestId("firstName"), "John");
      fireEvent.changeText(getByTestId("lastName"), "Doe");
      fireEvent.changeText(getByTestId("email"), "john.doe@example.com");
      fireEvent.changeText(getByTestId("password"), "password123");
  
      const signUpButton = getByText("Sign Up");
      fireEvent.press(signUpButton);
  
      // Wait for the error modal to appear
      const errorMessage = await screen.findByText("Sign up failed");
      expect(errorMessage).toBeTruthy();
    });
  });