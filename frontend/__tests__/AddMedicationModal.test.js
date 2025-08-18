/* global jest, describe, it, expect, beforeEach */
import React from "react";
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import AddMedicationPlanModal from "../components/AddMedicationModal";
import * as Notifications from 'expo-notifications';
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";
import { addMedication } from "../services/MedicationHandler";
// import { registerForPushNotificationsAsync } from "../services/Scheduler";

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
  
  jest.mock('../contexts/AppContext', () => ({
    useApp: jest.fn(),
  }));
  
  jest.mock('../contexts/AuthContext', () => ({
    useAuth: jest.fn(),
  }));
  
  jest.mock('../services/MedicationHandler', () => ({
    addMedication: jest.fn(),
  }));
  
  jest.mock('../services/Scheduler', () => ({
    registerForPushNotificationsAsync: jest.fn(),
  }));
  
  describe('AddMedicationPlanModal', () => {
    let mockAppContext;
    let mockAuthContext;
  
    beforeEach(() => {
      mockAppContext = {
        user: { id: 'mockUserId' },
        addMedication: jest.fn(),
        showError: jest.fn(),
      };
      
      mockAuthContext = {
        makeAuthenticatedRequest: jest.fn().mockImplementation((apiFunc, ...args) => {
          return apiFunc.mockImplementation ? apiFunc(...args) : Promise.resolve({ data: 'mockResult' });
        }),
      };
      
      useApp.mockReturnValue(mockAppContext);
      useAuth.mockReturnValue(mockAuthContext);
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
  
      const { getByTestId, getByText } = render(
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
  
    it('handles form submission with addMedication service call', async () => {
      addMedication.mockResolvedValueOnce({ id: 'mockMedicationId', name: 'Test Medication' });
      const mockOnSave = jest.fn();
      const mockOnClose = jest.fn();

      const { getByText, getByPlaceholderText } = render(
        <AddMedicationPlanModal visible={true} onClose={mockOnClose} onSave={mockOnSave} />
      );

      fireEvent.changeText(getByPlaceholderText('e.g. Aspirin'), 'Test Medication');
      fireEvent.press(getByText('Save Plan'));

      await waitFor(() => {
        expect(addMedication).toHaveBeenCalledTimes(1);
        expect(addMedication).toHaveBeenCalledWith(
          expect.any(Function), // makeAuthenticatedRequest function
          expect.objectContaining({
            medicationSpecification: expect.objectContaining({
              name: 'Test Medication'
            })
          })
        );
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'mockMedicationId',
            reminder: expect.any(Object)
          })
        );
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });    it('handles error correctly and shows ErrorModal', async () => {
      addMedication.mockRejectedValueOnce(new Error('Something went wrong'));

      const { getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );

      fireEvent.press(getByText('Save Plan'));

      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });
    });
    it('blocks submission if required fields are missing', async () => {
      addMedication.mockRejectedValueOnce(new Error('Name is required'));
      
      const { getByText } = render(
        <AddMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} />
      );
    
      fireEvent.press(getByText('Save Plan'));
    
      await waitFor(() => {
        expect(getByText('Error')).toBeTruthy();
      });
    });
    
  
    it('prevents duplicate reminder times from being added', async () => {
      const { getByTestId } = render(
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
      const { getByPlaceholderText, getByText } = render(
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

  

  