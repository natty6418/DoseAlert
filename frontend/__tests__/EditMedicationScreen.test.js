/* global jest, describe, it, expect, beforeEach */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditMedicationScreen from '../app/(tabs)/(medication)/edit';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import * as Scheduler from '../services/Scheduler';

// Mock dependencies
jest.mock('../contexts/AppContext', () => ({
  useApp: jest.fn(),
}));
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));
jest.mock('../services/Scheduler', () => ({
  ...jest.requireActual('../services/Scheduler'),
  scheduleReminders: jest.fn(),
  cancelScheduledReminders: jest.fn(),
  deleteSchedulesForMedication: jest.fn(),
  addSchedule: jest.fn(),
}));
jest.spyOn(Alert, 'alert');

describe('EditMedicationScreen', () => {
  let mockAppContext;
  let mockAuthContext;
  const medicationData = {
    id: 'med123',
    name: 'Aspirin',
    dosage: { amount: '200', unit: 'mg' },
    medicationSpecification: { name: 'Aspirin', directions: 'Take daily' },
    start_date: new Date().toISOString(),
    reminder: { enabled: true, times: [new Date().toISOString()] },
    schedule: { daysOfWeek: 'Mon,Wed,Fri' },
  };

  beforeEach(() => {
    mockAppContext = {
      updateMedication: jest.fn().mockResolvedValue({}),
      deleteMedication: jest.fn().mockResolvedValue({}),
      loadMedications: jest.fn(),
      showLoading: jest.fn(),
      hideLoading: jest.fn(),
      showError: jest.fn(),
    };
    mockAuthContext = {
      user: { id: 'user123' },
    };

    useApp.mockReturnValue(mockAppContext);
    useAuth.mockReturnValue(mockAuthContext);
    useLocalSearchParams.mockReturnValue({ medicationData: JSON.stringify(medicationData) });

    jest.clearAllMocks();
  });

  it('renders the medication name and loads initial days', () => {
    const { getByDisplayValue, getByText } = render(<EditMedicationScreen />);
    expect(getByDisplayValue('Aspirin')).toBeTruthy();
    // Check if the initial days are selected
    expect(getByText('Mon').props.accessibilityState.selected).toBe(true);
    expect(getByText('Tue').props.accessibilityState.selected).toBe(false);
  });

  it('shows validation error if no reminder days are selected when reminders are enabled', async () => {
    const { getByText, findByText } = render(<EditMedicationScreen />);
    
    // Deselect all days
    fireEvent.press(getByText('Mon'));
    fireEvent.press(getByText('Wed'));
    fireEvent.press(getByText('Fri'));

    fireEvent.press(getByText('Update Plan'));

    const error = await findByText('Please select at least one day for reminders.');
    expect(error).toBeTruthy();
  });

  it('calls handleUpdatePlan and updates medication', async () => {
    const { getByText } = render(<EditMedicationScreen />);
    fireEvent.press(getByText('Update Plan'));

    await waitFor(() => {
      expect(mockAppContext.showLoading).toHaveBeenCalledTimes(1);
      expect(Scheduler.cancelScheduledReminders).toHaveBeenCalledWith('med123');
      expect(Scheduler.deleteSchedulesForMedication).toHaveBeenCalledWith('med123');
      expect(mockAppContext.updateMedication).toHaveBeenCalledTimes(1);
      expect(Scheduler.addSchedule).toHaveBeenCalledTimes(1);
      expect(Scheduler.scheduleReminders).toHaveBeenCalledTimes(1);
      expect(mockAppContext.loadMedications).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Medication plan updated successfully!', expect.any(Array));
      expect(mockAppContext.hideLoading).toHaveBeenCalledTimes(1);
    });
  });

  it('calls handleDeletePlan and deletes medication', async () => {
    const { getByTestId } = render(<EditMedicationScreen />);
    fireEvent.press(getByTestId('delete-button'));

    // Mock the user confirming the delete action
    Alert.alert.mock.calls[0][2][1].onPress();

    await waitFor(() => {
      expect(mockAppContext.showLoading).toHaveBeenCalledTimes(1);
      expect(Scheduler.cancelScheduledReminders).toHaveBeenCalledWith('med123');
      expect(mockAppContext.deleteMedication).toHaveBeenCalledWith('med123');
      expect(mockAppContext.loadMedications).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Medication deleted successfully!', expect.any(Array));
      expect(mockAppContext.hideLoading).toHaveBeenCalledTimes(1);
    });
  });
});
