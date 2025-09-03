/* global jest, describe, it, expect, beforeEach */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddMedicationScreen from '../app/(tabs)/(medication)/add';
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
  addSchedule: jest.fn(),
  scheduleReminders: jest.fn(),
}));
jest.spyOn(Alert, 'alert');

describe('AddMedicationScreen', () => {
  let mockAppContext;
  let mockAuthContext;

  beforeEach(() => {
    mockAppContext = {
      addMedication: jest.fn().mockResolvedValue({ id: 'med456' }),
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
    useLocalSearchParams.mockReturnValue({});

    jest.clearAllMocks();
  });

  it('renders the initial form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<AddMedicationScreen />);
    expect(getByText('Add Medication')).toBeTruthy();
    expect(getByPlaceholderText('Enter medication name')).toBeTruthy();
  });

  it('shows validation error if no reminder days are selected when reminders are enabled', async () => {
    const { getByText, findByText } = render(<AddMedicationScreen />);
    
    // Deselect all days
    fireEvent.press(getByText('Mon'));
    fireEvent.press(getByText('Tue'));
    fireEvent.press(getByText('Wed'));
    fireEvent.press(getByText('Thu'));
    fireEvent.press(getByText('Fri'));
    fireEvent.press(getByText('Sat'));
    fireEvent.press(getByText('Sun'));

    fireEvent.press(getByText('Save'));

    const error = await findByText('Please select at least one day for reminders.');
    expect(error).toBeTruthy();
  });

  it('calls handleSavePlan and saves medication', async () => {
    const { getByText } = render(<AddMedicationScreen />);
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockAppContext.showLoading).toHaveBeenCalledTimes(1);
      expect(mockAppContext.addMedication).toHaveBeenCalledTimes(1);
      expect(Scheduler.addSchedule).toHaveBeenCalledTimes(2); // For the two default reminder times
      expect(Scheduler.scheduleReminders).toHaveBeenCalledTimes(1);
      expect(mockAppContext.loadMedications).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Medication plan saved successfully!', expect.any(Array));
      expect(mockAppContext.hideLoading).toHaveBeenCalledTimes(1);
    });
  });
});
