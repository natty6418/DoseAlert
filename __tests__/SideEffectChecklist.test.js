import React from "react";
import { render, fireEvent, screen } from '@testing-library/react-native';
import SideEffectChecklist from '../components/SideEffectChecklist';

jest.mock('../constants', () => ({
    icons: {
        CheckCircle: ({ color, size }) => <div style={{ color, fontSize: size }}>CheckCircle</div>,
        PlusCircle: ({ color, size }) => <div style={{ color, fontSize: size }}>PlusCircle</div>,
    },
}));

describe('SideEffectChecklist', () => {
    const defaultProps = {
        sideEffects: [
            { term: 'Nausea', checked: false },
            { term: 'Dizziness', checked: true },
        ],
        setSideEffects: jest.fn(),
    };

    it('renders the list of side effects with correct icons', () => {
        const { getByText, getAllByTestId } = render(<SideEffectChecklist {...defaultProps} />);

        expect(getByText('Nausea')).toBeTruthy();
        expect(getByText('Dizziness')).toBeTruthy();
        expect(getAllByTestId('checked').length).toBe(1); // Dizziness is checked
        expect(getAllByTestId('not-checked').length).toBe(1); // Nausea is unchecked
    });

    it('toggles side effect checked status when clicked', () => {
        const mockSetSideEffects = jest.fn();
        const { getByText } = render(
            <SideEffectChecklist {...defaultProps} setSideEffects={mockSetSideEffects} />
        );

        fireEvent.press(getByText('Nausea'));

        expect(mockSetSideEffects).toHaveBeenCalledWith([
            { term: 'Nausea', checked: true },
            { term: 'Dizziness', checked: true },
        ]);
    });

    it('adds a new side effect when submitting new item', () => {
        const mockSetSideEffects = jest.fn();
        const { getByPlaceholderText, getByText } = render(
            <SideEffectChecklist {...defaultProps} setSideEffects={mockSetSideEffects} />
        );

        const input = getByPlaceholderText('Add item....');
        fireEvent.changeText(input, 'Headache');
        fireEvent(input, 'submitEditing');

        expect(mockSetSideEffects).toHaveBeenCalledWith([
            ...defaultProps.sideEffects,
            { term: 'Headache', checked: true },
        ]);
    });
});
