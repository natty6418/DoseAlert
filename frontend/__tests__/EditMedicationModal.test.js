/* global jest, describe, it, expect, beforeEach */
import React from "react";
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditMedicationPlanModal from '../components/EditMedicationModal';
import * as Notifications from 'expo-notifications';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { updateMedication, deleteMedication } from '../services/MedicationHandler';

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
    updateMedication: jest.fn(),
    deleteMedication: jest.fn(),
}));
jest.mock('../services/Scheduler', () => ({
    registerForPushNotificationsAsync: jest.fn(),
}));

describe('EditMedicationPlanModal', () => {
    let mockAppContext;
    let mockAuthContext;
    const medicationData = {
        id: 'med123',
        medicationSpecification: { name: 'Aspirin', directions: 'Take daily' },
        dosage: { amount: '200', unit: 'mg' },
        startDate: new Date(),
        endDate: new Date(),
        frequency: 'Daily',
        reminder: { enabled: false, reminderTimes: [] },
        purpose: 'Pain relief'
    };

    beforeEach(() => {
        mockAppContext = {
            user: { id: 'mockUserId' },
            updateMedication: jest.fn(),
            deleteMedication: jest.fn(),
        };
        
        mockAuthContext = {
            makeAuthenticatedRequest: jest.fn(),
        };
        
        useApp.mockReturnValue(mockAppContext);
        useAuth.mockReturnValue(mockAuthContext);
        jest.clearAllMocks();
        Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    });

    it('renders modal when visible is true', () => {
        
        const { getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );

        expect(getByText('Edit Medication Plan')).toBeTruthy();
    });

    it('hides modal when visible is false', () => {
       
        const { queryByText } = render(
            <EditMedicationPlanModal visible={false} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );

        expect(queryByText('Edit Medication Plan')).toBeNull();
    });

    it('calls onClose when Cancel button is pressed', () => {
        const mockOnClose = jest.fn();
        const { getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={mockOnClose} onSave={jest.fn()} medicationData={medicationData} />
        );

        fireEvent.press(getByText('Cancel'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('updates name field when input is changed', () => {
        const { getByPlaceholderText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );

        const nameInput = getByPlaceholderText('e.g. Aspirin');
        fireEvent.changeText(nameInput, 'Updated Medication');

        expect(nameInput.props.value).toBe('Updated Medication');
    });

    it('calls updateMedication service and onSave on form submission', async () => {
        updateMedication.mockResolvedValueOnce({ data: {
            id: 'med123',
            medicationSpecification: { name: 'Updated Medication', directions: 'Take daily' },
            dosage: { amount: '200', unit: 'mg' },
            startDate: new Date(),
            endDate: new Date(),
            frequency: 'Daily',
            reminder: { enabled: false, reminderTimes: [] },
            purpose: 'Pain relief'
        }, error: null });
        const mockOnSave = jest.fn();
        const mockOnClose = jest.fn();
        const medicationData = {
            id: 'med123',
            medicationSpecification: { name: 'Aspirin', directions: 'Take daily' },
            dosage: { amount: '200', unit: 'mg' },
            startDate: new Date(),
            endDate: new Date(),
            frequency: 'Daily',
            reminder: { enabled: false, reminderTimes: [] },
            purpose: 'Pain relief'
        };

        const { getByText, getByPlaceholderText } = render(
            <EditMedicationPlanModal visible={true} onClose={mockOnClose} onSave={mockOnSave} medicationData={medicationData} />
        );

        fireEvent.changeText(getByPlaceholderText('e.g. Aspirin'), 'Updated Medication');
        fireEvent.press(getByText('Save Plan'));

        await waitFor(() => {
            expect(updateMedication).toHaveBeenCalledTimes(1);
            expect(updateMedication).toHaveBeenCalledWith(
                medicationData,
                expect.objectContaining({ name: 'Updated Medication' })
            );
            expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'med123' }));
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('handles delete action correctly', async () => {
        deleteMedication.mockResolvedValueOnce({ error: null });
        const mockOnDelete = jest.fn();
        const mockOnClose = jest.fn();
        

        const { getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={mockOnClose} onSave={jest.fn()} onDeleteMedication={mockOnDelete} medicationData={medicationData} />
        );

        fireEvent.press(getByText('Delete'));

        await waitFor(() => {
            expect(deleteMedication).toHaveBeenCalledWith('med123');
            expect(mockOnDelete).toHaveBeenCalledWith('med123');
            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });
    });

    it('handles error correctly and shows ErrorModal', async () => {
        updateMedication.mockRejectedValueOnce(new Error('Something went wrong'));

        const { getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );

        fireEvent.press(getByText('Save Plan'));

        await waitFor(() => {
            expect(getByText('Error')).toBeTruthy();
        });
    });
    it('calls handleStartDateChange and updates the start date', async () => {
        const { getByTestId, queryByTestId, getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );
    
        const selectedDate = new Date('2024-01-01');
        fireEvent.press(getByTestId('start-date'));
        await waitFor(() => expect(queryByTestId('startDatePicker')).toBeTruthy());
        fireEvent(getByTestId('startDatePicker'), 'onChange', {
            nativeEvent: { timestamp: selectedDate },
          });
    
        expect(getByText(selectedDate.toDateString())).toBeTruthy();
    });
    it('calls handleEndDateChange and updates the end date', async () => {
        const { getByTestId, queryByTestId, getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );
    
        const selectedDate = new Date('2024-12-01');
        fireEvent.press(getByTestId('end-date'));
        await waitFor(() => expect(queryByTestId('endDatePicker')).toBeTruthy());

        fireEvent(getByTestId('endDatePicker'), 'onChange', {
            nativeEvent: { timestamp: selectedDate },
          });

        expect(getByText(selectedDate.toDateString())).toBeTruthy();
    });
    it('schedules reminders when Enable Reminders is toggled and times are added', async () => {
        Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
    
        const { getByTestId, getByText } = render(
          <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData}/>
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
});
