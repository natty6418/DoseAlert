/* global jest, describe, it, expect */

import React from "react";
import { render, fireEvent } from '@testing-library/react-native';
import MedicationCardModal from '../components/MedicationCard';

jest.mock('../components/SideEffectChecklist', () => () => null);

describe('MedicationCardModal', () => {
    const defaultProps = {
        visible: true,
        onClose: jest.fn(),
        dosage: { amount: '200', unit: 'mg' },
        startDate: new Date('2024-01-01T00:00:00'),
        endDate: new Date('2024-12-31T00:00:00'),
        frequency: 'Daily',
        medicationSpecification: {
            name: 'Aspirin',
            directions: 'Take with food',
            warning: 'May cause drowsiness',
            sideEffects: [{ term: 'Nausea', checked: true }],
        },
        reminder: {
            enabled: true,
            reminderTimes: [{ time: new Date('2024-01-01T09:00:00') }],
        },
        onEdit: jest.fn(),
        isActive: true,
    };

    it('renders the modal with medication details when visible is true', () => {
        const { getByText } = render(<MedicationCardModal {...defaultProps} />);

        expect(getByText('Aspirin')).toBeTruthy();
        expect(getByText('Dosage: 200 mg')).toBeTruthy();
        expect(getByText('Frequency: Daily')).toBeTruthy();
        expect(getByText('Start Date: 1/1/2024')).toBeTruthy();
        expect(getByText('End Date: 12/31/2024')).toBeTruthy();
        expect(getByText('Directions:')).toBeTruthy();
        expect(getByText('Take with food')).toBeTruthy();
        expect(getByText('Warnings:')).toBeTruthy();
        expect(getByText('May cause drowsiness')).toBeTruthy();
    });

    it('does not render the modal when visible is false', () => {
        const { queryByText } = render(<MedicationCardModal {...defaultProps} visible={false} />);

        expect(queryByText('Aspirin')).toBeNull();
    });

    it('calls onClose when the Close button is pressed', () => {
        const mockOnClose = jest.fn();
        const { getByText } = render(<MedicationCardModal {...defaultProps} onClose={mockOnClose} />);

        fireEvent.press(getByText('Close'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onEdit when the Edit button is pressed', () => {
        const mockOnEdit = jest.fn();
        const { getByTestId } = render(<MedicationCardModal {...defaultProps} onEdit={mockOnEdit} />);

        fireEvent.press(getByTestId('edit-medication-button'));

        expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('displays unique reminder times when reminders are enabled', () => {
        const { getByText } = render(<MedicationCardModal {...defaultProps} />);

        expect(getByText('- 09:00 AM')).toBeTruthy();
    });

    it('does not display reminders section when reminders are disabled', () => {
        const props = {
            ...defaultProps,
            reminder: {
                enabled: false,
                reminderTimes: [],
            },
        };

        const { queryByText } = render(<MedicationCardModal {...props} />);

        expect(queryByText('Reminder:')).toBeNull();
    });
});