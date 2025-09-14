/* global jest, describe, expect, beforeEach, test */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Report from '../app/(tabs)/report';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { getAdherenceReport, getAdherenceSummary } from '../services/AdherenceTracker';

// Mock dependencies
jest.mock('../contexts/AppContext', () => ({
  useApp: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../services/AdherenceTracker', () => ({
  getAdherenceReport: jest.fn(),
  getAdherenceSummary: jest.fn(),
}));

jest.mock('../components/Loading', () => {
  const { Text } = require('react-native');
  return jest.fn(() => <Text testID="loading-spinner">Loading</Text>);
});
  

import PropTypes from 'prop-types';
import { Text, View } from 'react-native';

function MockResponseModal({ visible }) {
  if (!visible) return null;
  return (
    <View testID="response-modal">
      <Text>Response Modal</Text>
    </View>
  );
}
MockResponseModal.displayName = 'MockResponseModal';
MockResponseModal.propTypes = {
  visible: PropTypes.bool.isRequired,
};

jest.mock('../components/ResponseModal', () => MockResponseModal);

jest.mock('react-native-chart-kit', () => {
  const { Text } = require('react-native');
  return {
    ProgressChart: jest.fn(({ data }) => <Text>{`Chart data: ${data}`}</Text>),
  };
});

describe('Report Component', () => {
  let mockAppContext;
  let mockAuthContext;
  
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1); // Set to next year
  
  const mockMedications = [
    {
      id: 'med1',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: futureDate.toISOString(),
      end_date: futureDate.toISOString(), // Report component checks both formats
      medicationSpecification: { name: 'Aspirin' },
      reminder: { enabled: true, reminderTimes: [] },
    },
  ];

  const mockAdherenceReport = {
    medication_breakdown: [
      {
        medication_id: 'med1',
        taken: 5,
        missed: 2,
        adherence_rate: 71,
        current_taken_streak: 3,
        longest_taken_streak: 5,
        current_missed_streak: 1,
      }
    ]
  };

  const mockAdherenceSummary = {
    adherence_rate: 71,
    total_taken: 5,
    total_missed: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAppContext = {
      medications: mockMedications,
    };
    
    mockAuthContext = {
      makeAuthenticatedRequest: jest.fn()
        .mockImplementation((func) => {
          if (func === getAdherenceSummary) {
            return Promise.resolve(mockAdherenceSummary);
          }
          if (func === getAdherenceReport) {
            return Promise.resolve(mockAdherenceReport);
          }
          return Promise.resolve({});
        }),
    };
    
    useApp.mockReturnValue(mockAppContext);
    useAuth.mockReturnValue(mockAuthContext);
    
    getAdherenceReport.mockResolvedValue(mockAdherenceReport);
    getAdherenceSummary.mockResolvedValue(mockAdherenceSummary);
  });

  test('renders loading spinner initially', () => {
    const report = render(<Report />);
    expect(report.getByTestId('loading-spinner')).toBeTruthy();
  });

  test('renders medication list after loading', async () => {
    const report = render(<Report />);
    await waitFor(() => {
      expect(report.getByText('Aspirin')).toBeTruthy();
    });
  });

  

  test('renders overall adherence percentage', async () => {
    const report = render(<Report />);
    await waitFor(() => {
      const percentage = Math.round((5 / (5 + 2)) * 100);
      expect(report.queryAllByText(`${percentage}%`)[0]).toBeTruthy();
    });
  });

  test('renders adherence details for each medication', async () => {
    const report = render(<Report />);
    await waitFor(() => {
      expect(report.getByText('Current missed streak: 1')).toBeTruthy();
      expect(report.getAllByText('71%').length).toBeGreaterThan(0); // Check that 71% appears
    });
  });
});
