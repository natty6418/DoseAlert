import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import Report from '../app/(tabs)/report';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import { getAdherenceData } from '../services/AdherenceTracker';
import LoadingSpinner from '../components/Loading';
import { ProgressChart } from 'react-native-chart-kit';
import ResponseModal from '../components/ResponseModal';

// Mock dependencies
jest.mock('../contexts/FirebaseContext', () => ({
  useFirebaseContext: jest.fn(),
}));

jest.mock('../services/AdherenceTracker', () => ({
  getAdherenceData: jest.fn(),
}));

jest.mock('../components/Loading', () => {
  return jest.fn(() => <div testID="loading-spinner"></div>);
});
  

jest.mock('../components/ResponseModal', () => ({ visible }) =>
  visible ? <div>Response Modal</div> : null
);

jest.mock('react-native-chart-kit', () => ({
  ProgressChart: jest.fn(({ data }) => <div>{`Chart data: ${data}`}</div>),
}));

describe('Report Component', () => {
  const mockMedications = [
    {
      id: 'med1',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-12-31T00:00:00.000Z',
      medicationSpecification: { name: 'Aspirin' },
      reminder: { enabled: true, reminderTimes: [] },
    },
  ];

  const mockAdherenceData = {
    med1: { taken: 5, missed: 2, consecutiveMisses: 1, prevMiss: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useFirebaseContext.mockReturnValue({
      medications: mockMedications,
      adherenceResponseId: null,
      setAdherenceResponseId: jest.fn(),
    });
    getAdherenceData.mockResolvedValue(mockAdherenceData);
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
      expect(report.getByText('Consecutive Misses: 1')).toBeTruthy();
      expect(report.getByText('Adherence Percentage: 71%')).toBeTruthy();
    });
  });
});
