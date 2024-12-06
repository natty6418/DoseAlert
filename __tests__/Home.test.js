import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Home from '../app/(tabs)/home';
import { router } from 'expo-router';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import { getUser, getMedications } from '../services/firebaseDatabase';
import LoadingSpinner from '../components/Loading';
import { useFocusEffect } from 'expo-router';
import { Notifications, registerForPushNotificationsAsync } from '../services/registerNotification';

jest.mock('../services/registerNotification', () => ({
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
jest.mock('../contexts/FirebaseContext', () => ({
  useFirebaseContext: jest.fn(),
}));

jest.mock('../services/firebaseDatabase', () => ({
  getUser: jest.fn(),
  getMedications: jest.fn(),
}));
;

jest.mock('../components/Loading', () => {
  return jest.fn(() =><div testID='loading-spinner'></div>); // Mock LoadingSpinner to render nothing during tests
});
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useFocusEffect: jest.fn(),
}));


describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
  });

  test('should redirect to /signIn if user is not logged in', () => {
    useFirebaseContext.mockReturnValue({ isLoggedIn: false });

    render(<Home />);

    expect(router.replace).toHaveBeenCalledWith('/signIn');
  });

  test('should render loading spinner while loading', () => {
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    useFirebaseContext.mockReturnValue({ 
      isLoggedIn: true, 
      user: { id: '123' },
      medications: [],
      setMedications: jest.fn(),
     });
    getUser.mockResolvedValueOnce({ firstName: 'John' });
    getMedications.mockResolvedValueOnce([]);
    
    const { getByTestId } = render(<Home />);
    
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  test('should render the greeting once user data is loaded', async () => {
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    useFirebaseContext.mockReturnValue({ isLoggedIn: true, user: { id: '123', firstName: 'John' }, setMedications: jest.fn() });
    
    getMedications.mockResolvedValueOnce([]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText('Hello, John!')).toBeTruthy();
    });
  });

  test('should render "No medications found" if there are no upcoming medications', async () => {
    useFirebaseContext.mockReturnValue({ isLoggedIn: true, user: { id: '123' }, medications: [], setMedications: jest.fn() } );
    getMedications.mockResolvedValueOnce([]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText('No medications found.')).toBeTruthy();
    });
  });

  test('should render medication items if medications are found', async () => {
    const mockMedications = [
      {
        id: 'med1',
        reminder: { enabled: true },
        medicationSpecification: { name: 'Aspirin' },
        endDate: new Date("2024-12-31"),
      },
      {
        id: 'med2',
        reminder: { enabled: true },
        medicationSpecification: { name: 'Ibuprofen' },
        endDate: new Date("2024-12-31"),
      },
    ];
    useFirebaseContext.mockReturnValue({ 
      isLoggedIn: true, 
      user: { 
        id: '123',
        firstName: 'John',
       },
      medications: mockMedications,
      setMedications: jest.fn(),
      
      });
    getMedications.mockResolvedValueOnce(mockMedications);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      expect(getByText('Aspirin')).toBeTruthy();
      expect(getByText('Ibuprofen')).toBeTruthy();
    });
  });

  test('should navigate to create medication screen when "Add More" button is pressed', async () => {
    useFirebaseContext.mockReturnValue({ 
      isLoggedIn: true, 
      user: { id: '123' },
      medications: [],
      setMedications: jest.fn(),
    });
    getMedications.mockResolvedValueOnce([]);

    const { getByText } = render(<Home />);

    await waitFor(() => {
      const addButton = getByText('+ Add More');
      fireEvent.press(addButton);
      expect(router.push).toHaveBeenCalledWith('/create');
    });
  });
});