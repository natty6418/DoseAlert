/* global jest, describe, expect, beforeEach, test */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Home from '../app/(tabs)/home';
import { router } from 'expo-router';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
// import LoadingSpinner from '../components/Loading';
// import { useFocusEffect } from 'expo-router';
import { Notifications } from '../services/Scheduler';

// Import mocked functions
const { editMedication } = require('../services/MedicationHandler');

jest.mock('../services/Scheduler', () => ({
  Notifications: {
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
  },
},
registerForPushNotificationsAsync: jest.fn(),

}));
// Mock dependencies
jest.mock('../contexts/AppContext', () => ({
  useApp: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/MedicationHandler', () => ({
  editMedication: jest.fn(),
}));

jest.mock('../components/Loading', () => {
  const { View } = require('react-native');
  return jest.fn(() => <View testID="loading-spinner" />);
});
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useFocusEffect: jest.fn(),
}));


describe('Home Component', () => {
  let mockAppContext;
  let mockAuthContext;

  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    
    // Set up default mock contexts
    mockAppContext = {
      medications: [],
      user: { id: '123', name: 'John' },
      loadMedications: jest.fn().mockResolvedValue([]),
      updateMedication: jest.fn(),
    };
    
    mockAuthContext = {
      isAuthenticated: true,
    };
    
    useApp.mockReturnValue(mockAppContext);
    useAuth.mockReturnValue(mockAuthContext);
  });

  test('should redirect to /signIn if user is not logged in', () => {
    mockAuthContext.isAuthenticated = false;
    useAuth.mockReturnValue(mockAuthContext);

    render(<Home />);

    expect(router.replace).toHaveBeenCalledWith('/signIn');
  });

  test('should render loading spinner while loading', () => {
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    
    const { getByTestId } = render(<Home />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  test('should render the greeting once user data is loaded', async () => {
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    mockAppContext.user = { id: '123', firstName: 'John' };
    useApp.mockReturnValue(mockAppContext);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText('Hello, John!')).toBeTruthy();
    });
  });

  test('should render "No medications found" if there are no upcoming medications', async () => {
    mockAppContext.medications = [];
    useApp.mockReturnValue(mockAppContext);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText('No medications found.')).toBeTruthy();
    });
  });

  test('should render medication items if medications are found', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // Set date to next year
    
    const mockMedications = [
      {
        id: 'med1',
        reminder: { enabled: true },
        medicationSpecification: { name: 'Aspirin' },
        endDate: futureDate,
        end_date: futureDate, // Home component checks both formats
      },
      {
        id: 'med2',
        reminder: { enabled: true },
        medicationSpecification: { name: 'Ibuprofen' },
        endDate: futureDate,
        end_date: futureDate, // Home component checks both formats
      },
    ];
    
    // Mock loadMedications to resolve successfully and quickly
    const mockLoadMedications = jest.fn().mockResolvedValue(mockMedications);
    
    // Update the context with medications and working loadMedications
    const updatedContext = {
      ...mockAppContext,
      medications: mockMedications,
      loadMedications: mockLoadMedications,
      user: { id: '123', firstName: 'John' }
    };
    useApp.mockReturnValue(updatedContext);

    const { getByText } = render(<Home />);

    // Wait for loading to complete and medications to be displayed
    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Ibuprofen')).toBeTruthy();
    });

    // Verify loadMedications was called
    expect(mockLoadMedications).toHaveBeenCalled();
  });

  test('should navigate to create medication screen when "Add More" button is pressed', async () => {
    mockAppContext.medications = [];
    useApp.mockReturnValue(mockAppContext);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      const addButton = getByText('+ Add More');
      fireEvent.press(addButton);
      expect(router.push).toHaveBeenCalledWith('/create');
    });
  });
  
  test('should handle notification response and navigate to the report screen', async () => {
    const mockSetAdherenceResponseId = jest.fn();
    mockAppContext.setAdherenceResponseId = mockSetAdherenceResponseId;
    mockAppContext.medications = [];
    useApp.mockReturnValue(mockAppContext);
    
    Notifications.addNotificationResponseReceivedListener.mockImplementationOnce((callback) => {
      callback({
        notification: {
          request: {
            content: { data: { medicationId: 'med123' } },
          },
        },
      });
      return { remove: jest.fn() };
    });
  
    render(<Home />);
  
    await waitFor(() => {
      expect(mockSetAdherenceResponseId).toHaveBeenCalledWith('med123');
      expect(router.push).toHaveBeenCalledWith('/report');
    });
  });
  test('should fetch and set medications correctly', async () => {
    const mockMedications = [
      { id: 'med1', endDate: new Date('2024-12-31'), reminder: { enabled: true } },
      { id: 'med2', endDate: new Date('2023-01-01'), reminder: { enabled: true } },
    ];
    const mockLoadMedications = jest.fn().mockResolvedValue(mockMedications);
  
    mockAppContext.medications = [];
    mockAppContext.loadMedications = mockLoadMedications;
    useApp.mockReturnValue(mockAppContext);
  
    render(<Home />);
  
    await waitFor(() => {
      expect(mockLoadMedications).toHaveBeenCalled();
    });
  });
  test('should update reminders correctly', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // Set to next year
    
    const mockMedications = [
      {
        id: 'med1',
        medicationSpecification: { name: 'Test Medication' },
        startDate: new Date(),
        endDate: futureDate,
        end_date: futureDate, // Home component checks both formats
        reminder: { enabled: true, reminderTimes: [{time: new Date()}] },
      },
    ];
    const mockLoadMedications = jest.fn().mockResolvedValue(mockMedications);
    const mockEditMedication = jest.fn().mockResolvedValueOnce({ data: { ...mockMedications[0] } });
  
    mockAppContext.medications = mockMedications;
    mockAppContext.loadMedications = mockLoadMedications;
    mockAppContext.updateMedication = mockEditMedication;
    useApp.mockReturnValue(mockAppContext);
    
    editMedication.mockResolvedValueOnce({ ...mockMedications[0] });
  
    const { getByText, getByTestId } = render(<Home />);
    await waitFor(() => {
      const medication = getByText('Test Medication');
      fireEvent.press(medication);
    });

    await waitFor(() => {
      expect(getByTestId('delete-reminder-button')).toBeTruthy();
    });
    const deleteButton = getByTestId('delete-reminder-button');
    fireEvent.press(deleteButton);
  });
  
});
