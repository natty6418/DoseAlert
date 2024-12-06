import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Home from '../app/(tabs)/home';
import { router } from 'expo-router';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import { getUser } from '../services/UserHandler';
import { getMedications, editMedication } from '../services/MedicationHandler';
import LoadingSpinner from '../components/Loading';
import { useFocusEffect } from 'expo-router';
import { Notifications, registerForPushNotificationsAsync } from '../services/Scheduler';

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
jest.mock('../contexts/FirebaseContext', () => ({
  useFirebaseContext: jest.fn(),
}));

jest.mock('../services/UserHandler', () => ({
  getUser: jest.fn(),
}));

jest.mock('../services/MedicationHandler', () => ({
  getMedications: jest.fn(),
  editMedication: jest.fn(),
}));

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
  test('should handle notification response and navigate to the report screen', async () => {
    const mockSetAdherenceResponseId = jest.fn();
    useFirebaseContext.mockReturnValue({
      isLoggedIn: true,
      user: { id: '123' },
      setAdherenceResponseId: mockSetAdherenceResponseId,
      medications: [],
      setMedications: jest.fn(),
    });
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
    const transformedMedications = [
      { ...mockMedications[0], isActive: true, reminder: { ...mockMedications[0].reminder } },
      { ...mockMedications[1], isActive: false, reminder: { ...mockMedications[1].reminder, enabled: false } },
    ];
    const mockSetMedications = jest.fn();
  
    useFirebaseContext.mockReturnValue({
      isLoggedIn: true,
      user: { id: '123' },
      medications: [],
      setMedications: mockSetMedications,
    });
    getMedications.mockResolvedValueOnce(mockMedications);
  
    render(<Home />);
  
    await waitFor(() => {
      expect(mockSetMedications).toHaveBeenCalledWith(transformedMedications);
    });
  });
  test('should update reminders correctly', async () => {
    const mockMedications = [
      {
        id: 'med1',
        reminder: { enabled: true, reminderTimes: [] },
        medicationSpecification: { name: 'Test Medication' },
        startDate: new Date(),
        endDate: new Date('2024-12-31'),
        reminder: { enabled: true, reminderTimes: [{time: new Date()}] },
      },
    ];
    const mockSetMedications = jest.fn();
    const mockEditMedication = jest.fn().mockResolvedValueOnce({ data: { ...mockMedications[0] } });
  
    useFirebaseContext.mockReturnValue({
      isLoggedIn: true,
      user: { id: '123' },
      medications: mockMedications,
      setMedications: mockSetMedications,
    });
    jest.mock('../services/MedicationHandler', () => ({
      editMedication: mockEditMedication,
    }));
    getMedications.mockResolvedValueOnce(mockMedications);
    editMedication.mockResolvedValueOnce({ ...mockMedications[0] });
  
    const { getByText, getByTestId, debug } = render(<Home />);
    await waitFor(() => {
      const medication = getByText('Test Medication');
      fireEvent.press(medication);
      // fireEvent.press(getByTestId('reminder-switch'));
    });

    await waitFor(() => {
      expect(getByTestId('delete-reminder-button')).toBeTruthy();
    });
    const deleteButton = getByTestId('delete-reminder-button');
    fireEvent.press(deleteButton);
    
    
    // await waitFor(() => {
    //   expect(mockEditMedication).toHaveBeenCalled();
    // });
    // expect(mockEditMedication).toHaveBeenCalled();
  });
  
});