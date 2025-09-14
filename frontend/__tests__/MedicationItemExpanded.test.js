/* global jest, describe, it, expect, beforeEach */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MedicationItemExpanded from '../components/MedicationItemExpanded';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import * as Scheduler from '../services/Scheduler';

// Mock dependencies
jest.mock('../contexts/AppContext', () => ({
  useApp: jest.fn(),
}));
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));
jest.mock('../services/Scheduler', () => ({
  ...jest.requireActual('../services/Scheduler'),
  deleteSchedulesForMedication: jest.fn(),
  addSchedule: jest.fn(),
}));
jest.spyOn(Alert, 'alert');

describe('MedicationItemExpanded', () => {
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
      loadMedications: jest.fn(),
    };
    mockAuthContext = {
      user: { id: 'user123' },
    };

    useApp.mockReturnValue(mockAppContext);
    useAuth.mockReturnValue(mockAuthContext);

    jest.clearAllMocks();
  });

  it('renders the component with medication data', () => {
    const { getByText } = render(<MedicationItemExpanded item={medicationData} />);
    expect(getByText('Aspirin')).toBeTruthy();
    expect(getByText('Mon').props.style).toContainEqual(expect.objectContaining({ backgroundColor: '#6366F1' }));
  });

  it('calls handleSaveChanges and updates medication', async () => {
    const { getByText } = render(<MedicationItemExpanded item={medicationData} />);
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(mockAppContext.updateMedication).toHaveBeenCalledTimes(1);
      expect(Scheduler.deleteSchedulesForMedication).toHaveBeenCalledWith('med123');
      expect(Scheduler.addSchedule).toHaveBeenCalledTimes(1);
      expect(mockAppContext.loadMedications).toHaveBeenCalledTimes(1);
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Medication updated successfully!');
    });
  });
});
