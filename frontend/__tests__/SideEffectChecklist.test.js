/* global jest, describe, it, expect */

import React from "react";
import { render, fireEvent } from '@testing-library/react-native';
import SideEffectChecklist from '../components/SideEffectChecklist';

jest.mock('../constants', () => {

    const {Text} = require('react-native');
    
    return {
    icons: {
        CheckCircle: function CheckCircle({ color, size }) {
            return (
                <div style={{ color, fontSize: size }}>
                    <Text>CheckCircle</Text>
                </div>
            );
        },
        PlusCircle: function PlusCircle({ color, size }) {
            return (
                <div style={{ color, fontSize: size }}>
                    <Text>PlusCircle</Text>
                </div>
            );
        },
    },
}});

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
});
