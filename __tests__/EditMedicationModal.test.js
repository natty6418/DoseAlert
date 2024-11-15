import React from "react";
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EditMedicationPlanModal from '../components/EditMedicationModal';
import * as Notifications from 'expo-notifications';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import { editMedication, deleteMedication } from '../services/firebaseDatabase';
import { registerForPushNotificationsAsync } from '../services/registerNotification';
import LoadingSpinner from '../components/Loading';

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
    editMedication: jest.fn(),
    deleteMedication: jest.fn(),
}));
jest.mock('../services/registerNotification', () => ({
    registerForPushNotificationsAsync: jest.fn(),
}));

describe('EditMedicationPlanModal', () => {
    let mockContext;
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
        mockContext = { user: { uid: 'mockUserId' } };
        useFirebaseContext.mockReturnValue(mockContext);
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

    it('calls editMedication service and onSave on form submission', async () => {
        editMedication.mockResolvedValueOnce({ data: 'mockMedicationId', error: null });
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
            expect(editMedication).toHaveBeenCalledTimes(1);
            expect(editMedication).toHaveBeenCalledWith(
                'med123',
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
        editMedication.mockRejectedValueOnce(new Error('Something went wrong'));

        const { getByText } = render(
            <EditMedicationPlanModal visible={true} onClose={jest.fn()} onSave={jest.fn()} medicationData={medicationData} />
        );

        fireEvent.press(getByText('Save Plan'));

        await waitFor(() => {
            expect(getByText('Error')).toBeTruthy();
        });
    });
});
