/* global jest, describe, it, expect, beforeEach */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { addMedication } from '../services/MedicationHandler';
import { fetchDrugLabelInfo, fetchDrugSideEffects } from '../services/externalDrugAPI';
import CreateScreen from '../app/(tabs)/create';

// Import mocked functions
const { useCameraPermissions } = require('expo-camera');
// Mock the dependencies
jest.mock('../contexts/AppContext', () => ({
  useApp: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-camera', () => ({
    useCameraPermissions: jest.fn(),
    CameraView: jest.fn(() => {
      const { Text } = require('react-native');
      return <Text testID="camera-view">Mock Camera</Text>;
    }),
  }));

jest.mock('../services/MedicationHandler', () => ({
  getMedications: jest.fn(),
  deleteMedication: jest.fn().mockResolvedValue({ data: 'med1', error: null }),
  addMedication: jest.fn()
}));

jest.mock('../services/externalDrugAPI', () => ({
  fetchDrugLabelInfo: jest.fn(),
  fetchDrugSideEffects: jest.fn(),
}));

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

jest.mock('../services/Scheduler', () => ({
  registerForPushNotificationsAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
}));

describe('CreateScreen', () => {
    let mockAppContext;
    let mockAuthContext;
    
    beforeEach(() => {
        jest.clearAllMocks();
        Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
        
        mockAppContext = {
          user: { id: 'test-uid' },
          medications: [
              {
                  id: 'med1',
                  medicationSpecification: { 
                      name: 'Aspirin',
                      sideEffects: [
                          { term: 'Nausea', checked: true },
                          { term: 'Headache', checked: false }
                      ],
                      directions: 'Take 1 tablet every 4-6 hours',
                  },
                  dosage: { amount: 10, unit: 'mg' },
                  startDate: new Date('2023-01-01'),
                  endDate: new Date('2024-12-31'),
                  frequency: 'Daily',
                  reminder: { enabled: true, reminderTimes: [] },
                  isActive: true,
              },
          ],
          addMedication: jest.fn(),
          updateMedication: jest.fn(),
          removeMedication: jest.fn(),
          showLoading: jest.fn(),
          hideLoading: jest.fn(),
        };
        
        mockAuthContext = {
          makeAuthenticatedRequest: jest.fn(),
        };
        
        useApp.mockReturnValue(mockAppContext);
        useAuth.mockReturnValue(mockAuthContext);
        useCameraPermissions.mockReturnValue([
            { granted: true },
            jest.fn(), // Mock requestPermission function
          ]);

                
    
        fetchDrugLabelInfo.mockResolvedValue({
          openfda: { brand_name: ['Mock Drug'], package_ndc: ['123456789'] },
          purpose: 'Pain reliever',
          warnings: 'Do not use if allergic to aspirin',
          dosage_and_administration: 'Take 1 tablet every 4-6 hours',
        });
    
        fetchDrugSideEffects.mockResolvedValue([
           {term: 'Nausea' },
          {term: 'Headache'},
        ]);
      });
    
      it('renders correctly with medication plans', async () => {
        const { getByText } = render(<CreateScreen />);
    
        
        await waitFor(() => expect(getByText('Aspirin')).toBeTruthy());
        
      });
    
    
      it('saves a new medication plan', async () => {
        const { getByText, queryByText } = render(<CreateScreen />);
    
        const addButton = getByText('Add');
        fireEvent.press(addButton);
    
        const saveButton = getByText('Save Plan');
        fireEvent.press(saveButton);
    
        await waitFor(() => expect(queryByText('Aspirin')).toBeTruthy());
      });
    
      it('opens edit medication modal when edit button is pressed', async () => {
        const { getByText, getByTestId } = render(<CreateScreen />);
    
        await waitFor(() => expect(getByText('Aspirin')).toBeTruthy());
    
        const aspirinItem = getByText('Aspirin');
        fireEvent.press(aspirinItem);
    
        const editButton = getByTestId('edit-medication-button');
        fireEvent.press(editButton);
    
        expect(getByText('Edit Medication Plan')).toBeTruthy();
      });
    
      it('deletes a medication plan', async () => {
        const { getByText, queryByText, getByTestId } = render(<CreateScreen />);
    
        await waitFor(() => expect(getByText('Aspirin')).toBeTruthy());
        
        const aspirinItem = getByText('Aspirin');
        fireEvent.press(aspirinItem);

        const editButton = getByTestId('edit-medication-button');
        fireEvent.press(editButton);

        const deleteButton = getByText('Delete');
        fireEvent.press(deleteButton);
        
        // Update mock to reflect empty medications after deletion
        mockAppContext.medications = [];
        
        await waitFor(() => {
            const deletedItem = queryByText('Aspirin');
            expect(deletedItem).toBeNull();
        });
      }); 
      
      it('handles UPC scan and shows add medication modal with fetched data', async () => {
        const { getByText, getByTestId, getByDisplayValue } = render(<CreateScreen />);
    
        const scanButton = getByText('scan');
        fireEvent.press(scanButton);
    
        await waitFor(() => expect(getByText('Scan Barcode')).toBeTruthy());
    
        await act(async () => {
            // Simulate the scan event by firing the correct event handler
            fireEvent(getByTestId('camera-modal'), 'onScan', { data: '123456789' });
        });
        await waitFor(() => expect(fetchDrugLabelInfo).toHaveBeenCalledWith('123456789'));
        await waitFor(() => expect(getByTestId('add-medication-modal')).toBeTruthy());
        await waitFor(()=>expect(getByDisplayValue('Mock Drug')).toBeTruthy());
        expect(getByText('Nausea')).toBeTruthy();
      });
  
  

      
    it('shows CameraModal when Scan button is pressed', async () => {
        useCameraPermissions.mockReturnValue([
            { granted: true },
            jest.fn(), // Mock requestPermission function
          ]);
        const { getByText, queryByTestId } = render(<CreateScreen />);
        await act(async () => {
  
        // Initially, the CameraModal should not be visible
        expect(queryByTestId('camera-modal')).toBeNull();
  
        // Press the "Scan" button
        const scanButton = getByText('scan');
        fireEvent.press(scanButton);
  
        // CameraModal should now be visible
        await waitFor(() => expect(getByText('Scan Barcode')).toBeTruthy());
      });
    });
  
    it('filters medication plans when using search bar', async () => {
    const { getByPlaceholderText, queryByText } = render(<CreateScreen />);
      await act(async () => {
  
        // Wait for medication plans to be loaded
        await waitFor(() => expect(queryByText('Aspirin')).toBeTruthy());
  
        // Type into the search bar to filter
        const searchBar = getByPlaceholderText('Search medication plans...');
        fireEvent.changeText(searchBar, 'Tylenol');
  
        // Aspirin should no longer be visible as it doesn't match the search term
        await waitFor(() => expect(queryByText('Aspirin')).toBeNull());
      });
    });
  
    it('adds a new medication plan when handleSavePlan is called', async () => {
        const { getByText, queryByText, getByPlaceholderText, getByTestId } = render(<CreateScreen />);
        
        addMedication.mockResolvedValueOnce({ data: {
            id: 'med2',
            medicationSpecification: { name: 'Mock Drug', sideEffects: [], directions: '' },
            dosage: { amount: 10, unit: 'mg' },
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-12'),
            frequency: 'Daily',
            reminder: { enabled: false, reminderTimes: [] },
          }, error: null });
       

        // Wait for the initial medication to load
        await waitFor(() => expect(queryByText('Aspirin')).toBeTruthy());
      
        // Press the "Add" button to open the AddMedicationPlanModal
        const addButton = getByText('Add');
        fireEvent.press(addButton);
      
        // Ensure the AddMedicationPlanModal is opened
        await waitFor(() => expect(getByText('Add Medication Plan')).toBeTruthy());
      
        // Fill out the medication form fields
        fireEvent.changeText(getByPlaceholderText('e.g. Aspirin'), 'Mock Drug');
        fireEvent.changeText(getByPlaceholderText('Amount (e.g. 200)'), 10);
        fireEvent.changeText(getByPlaceholderText('Units (e.g. mg)'), 'mg');
        const startDateField = getByTestId('start-date-field');
        fireEvent.press(startDateField);

        // Simulate setting the start date using DateTimePicker
        await waitFor(() => {
            expect(getByTestId('start-date-picker')).toBeTruthy();
          });
        fireEvent(getByTestId('start-date-picker'), 'onChange', {
            type: 'set',
            nativeEvent: { timestamp: new Date('2024-01-01').getTime() },
        });

        // Press the end date field to open the DateTimePicker
        const endDateField = getByTestId('end-date-field');
        fireEvent.press(endDateField);

        // Simulate setting the start date using DateTimePicker
        await waitFor(() => {
            expect(getByTestId('end-date-picker')).toBeTruthy();
          });
        fireEvent(getByTestId('end-date-picker'), 'onChange', {
            type: 'set',
            nativeEvent: { timestamp: new Date('2024-12-12').getTime() },
        });
        // Press the "Save Plan" button to add the medication
        const saveButton = getByText('Save Plan');
        fireEvent.press(saveButton);
        
        // Update mock to include the new medication
        mockAppContext.medications = [
            {
                id: 'med1',
                medicationSpecification: { 
                    name: 'Aspirin',
                    sideEffects: [
                        { term: 'Nausea', checked: true },
                        { term: 'Headache', checked: false }
                    ],
                    directions: 'Take 1 tablet every 4-6 hours',
                },
                dosage: { amount: 10, unit: 'mg' },
                startDate: new Date('2023-01-01'),
                endDate: new Date('2024-12-31'),
                frequency: 'Daily',
                reminder: { enabled: true, reminderTimes: [] },
                isActive: true,
            },
            {
                id: 'med2',
                medicationSpecification: { 
                    name: 'Mock Drug',
                    sideEffects: [],
                    directions: '',
                },
                dosage: { amount: 10, unit: 'mg' },
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-12'),
                frequency: 'Daily',
                reminder: { enabled: false, reminderTimes: [] },
                isActive: true,
            },
        ];
        // Ensure the new medication has been added to the list
        await waitFor(() => expect(queryByText('Mock Drug')).toBeTruthy());
      });
  
  });