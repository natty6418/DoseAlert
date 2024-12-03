import React from "react";
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AddMedicationPlanModal from "../components/AddMedicationModal";
import * as Notifications from 'expo-notifications';
import { useFirebaseContext } from "../contexts/FirebaseContext";
import { addNewMedication } from "../services/firebaseDatabase";
import { registerForPushNotificationsAsync } from "../services/registerNotification";
import LoadingSpinner from "../components/Loading";

jest.mock('expo-notifications', () => ({
    requestPermissionsAsync: jest.fn(),
    getExpoPushTokenAsync: jest.fn(),
    setNotificationChannelAsync: jest.fn(),
    scheduleNotificationAsync: jest.fn(),
    setNotificationHandler: jest.fn(),
    AndroidImportance: {
      MAX: 'max',
    },
  }));
  jest.mock('../contexts/FirebaseContext', () => ({
    useFirebaseContext: jest.fn(),
  }));
  jest.mock('../services/firebaseDatabase', () => ({
    addNewMedication: jest.fn(),
  }));
  jest.mock('../services/registerNotification', () => ({
    registerForPushNotificationsAsync: jest.fn(),
  }));
  
  describe('AddMedicationPlanModal', () => {
    let mockContext;
  
    beforeEach(() => {
      mockContext = { user: { uid: 'mockUserId' } };
      useFirebaseContext.mockReturnValue(mockContext);
      jest.clearAllMocks();
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    });
  
    it('renders modal when visible is true', () => {
      const { getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
  
      expect(getByText('Add Medication Plan')).toBeTruthy();
    });
  
    it('hides modal when visible is false', () => {
      const { queryByText } = render(
        <AddMedicationPlanModal visible={false} onClose={jest.fn()} onSave={jest.fn()} />
      );
  
      expect(queryByText('Add Medication Plan')).toBeNull();
    });
  
    it('calls onClose when Cancel button is pressed', () => {
      const mockOnClose = jest.fn();
      const { getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={mockOnClose} onSave={jest.fn()} />
      );
  
      fireEvent.press(getByText('Cancel'));
  
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  
    it('updates name field when input is changed', () => {
      const { getByPlaceholderText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
  
      const nameInput = getByPlaceholderText('e.g. Aspirin');
      fireEvent.changeText(nameInput, 'Test Medication');
  
      expect(nameInput.props.value).toBe('Test Medication');
    });
  
    it('schedules reminders when Enable Reminders is toggled and times are added', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  
      const { getByTestId, getByPlaceholderText, getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
  
      // Toggle the switch to enable reminders (locate the switch by testID)
      const reminderSwitch = getByTestId('enable-reminders-switch');
      fireEvent(reminderSwitch, 'valueChange', true); // Toggle the switch to enable
  
      // Wait for the "Add Reminder Button" to appear after enabling reminders
      await waitFor(() => {
        expect(getByTestId('add-reminder-button')).toBeTruthy();
      });
      fireEvent.press(getByTestId('add-reminder-button'));
      
      // Mock DateTimePicker value
      await waitFor(() => {
        expect(getByTestId('date-time-picker')).toBeTruthy();
      });
  
      // Simulate selecting a time in the DateTimePicker
      fireEvent(getByTestId('date-time-picker'), 'onChange', {
        nativeEvent: { timestamp: new Date('2024-01-01T09:00:00') },
      });
      
      await waitFor(() => {
        expect(getByText('09:00 AM')).toBeTruthy();
      });
      // Expect reminder to be scheduled
    //   await waitFor(() => {
    //     expect(getByText('Scheduled Reminder')).toBeTruthy();
    //   });
    });
  
    it('handles form submission with addNewMedication service call', async () => {
      addNewMedication.mockResolvedValueOnce({ data: 'mockMedicationId', error: null });
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();
  
      const { getByText, getByPlaceholderText } = render(
        <AddMedicationPlanModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
      );
  
      fireEvent.changeText(getByPlaceholderText('e.g. Aspirin'), 'Test Medication');
      fireEvent.press(getByText('Save Plan'));
  
      await waitFor(() => {
        expect(addNewMedication).toHaveBeenCalledTimes(1);
        expect(addNewMedication).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Test Medication' })
        );
        expect(mockOnSave).toHaveBeenCalledWith(
          'mockMedicationId'
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  
    it('handles error correctly and shows ErrorModal', async () => {
      addNewMedication.mockRejectedValueOnce(new Error('Something went wrong'));
  
      const { getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
  
      fireEvent.press(getByText('Save Plan'));
  
      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });
    });
    it('blocks submission if required fields are missing', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
      addNewMedication.mockResolvedValueOnce({ data: null, error: 'Name is required' });
    
      fireEvent.press(getByText('Save Plan'));
    
      await waitFor(() => {
        expect(getByText('Name is required')).toBeTruthy();
      });
    });
    
  
    it('prevents duplicate reminder times from being added', async () => {
      const { getByTestId, getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
    
      // Enable reminders and add a time
      fireEvent(getByTestId('enable-reminders-switch'), 'valueChange', true);
      fireEvent.press(getByTestId('add-reminder-button'));
    
      fireEvent(getByTestId('date-time-picker'), 'onChange', {
        nativeEvent: { timestamp: new Date('2024-01-01T09:00:00') },
      });
    
      // Try adding the same time again
      fireEvent.press(getByTestId('add-reminder-button'));
      fireEvent(getByTestId('date-time-picker'), 'onChange', {
        nativeEvent: { timestamp: new Date('2024-01-01T09:00:00') },
      });
    
      await waitFor(() => {
        const reminders = screen.getAllByText('09:00 AM');
        expect(reminders.length).toBe(1); // Only one instance of the time
      });
    });
    
    it('allows adding side effects dynamically', async () => {
      const { getByPlaceholderText, getByText, queryByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
    
      // Add a side effect
      const sideEffectInput = getByPlaceholderText('Add item....');
      fireEvent.changeText(sideEffectInput, 'Dizziness');
      fireEvent(sideEffectInput, 'submitEditing');
    
      await waitFor(() => {
        expect(getByText('Dizziness')).toBeTruthy();
      });
    
      
    });
    
  });

  

  