/* global jest, describe, it, expect */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MedicationItemExpanded from '../components/MedicationItemExpanded';

  

describe('MedicationItemExpanded', () => {
    it("should call toggleExpand when the header is pressed", () => {
        const mockToggleExpand = jest.fn();
        const item = {
          medicationSpecification: { name: "Test Medication" },
          startDate: new Date(),
          endDate: new Date(),
          reminder: { enabled: false, reminderTimes: [] },
        };
      
        const { getByText } = render(
          <MedicationItemExpanded item={item} toggleExpand={mockToggleExpand} onToggleReminder={jest.fn()} onUpdateReminderTimes={jest.fn()} />
        );
      
        fireEvent.press(getByText("Test Medication"));
      
        expect(mockToggleExpand).toHaveBeenCalled();
      });
      it("should call onToggleReminder with the correct value when the switch is toggled", () => {
        const mockOnToggleReminder = jest.fn();
        const item = {
          medicationSpecification: { name: "Test Medication" },
          startDate: new Date(),
          endDate: new Date(),
          reminder: { enabled: false, reminderTimes: [] },
        };
      
        const { getByRole } = render(
          <MedicationItemExpanded item={item} toggleExpand={jest.fn()} onToggleReminder={mockOnToggleReminder} onUpdateReminderTimes={jest.fn()} />
        );
      
        const switchElement = getByRole("switch");
        fireEvent(switchElement, "valueChange", true);
      
        expect(mockOnToggleReminder).toHaveBeenCalledWith(true);
      });
      it("should add a new reminder using the real DateTimePicker", async () => {
        const mockOnUpdateReminderTimes = jest.fn();
        const item = {
          medicationSpecification: { name: "Test Medication" },
          startDate: new Date(),
          endDate: new Date(),
          reminder: { enabled: true, reminderTimes: [] },
        };
      
        const { getByTestId } = render(
          <MedicationItemExpanded
            item={item}
            toggleExpand={jest.fn()}
            onToggleReminder={jest.fn()}
            onUpdateReminderTimes={mockOnUpdateReminderTimes}
          />
        );
      
        // Simulate adding a new reminder
        fireEvent.press(getByTestId("add-reminder-button"));
      
        // Wait for DateTimePicker to appear
        await waitFor(() => expect(getByTestId("time-picker")).toBeTruthy());
      
        // Simulate selecting a time
        fireEvent(getByTestId("time-picker"), "onChange", {
          type: "set",
          nativeEvent: { timestamp: new Date("2024-01-01T09:00:00").getTime() },
        });
      
        // Check if the callback was called with the new time
        expect(mockOnUpdateReminderTimes).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ time: new Date("2024-01-01T09:00:00") })])
        );
      });
      
      it("should edit an existing reminder and call onUpdateReminderTimes", async () => {
        const mockOnUpdateReminderTimes = jest.fn();
        const initialTime = new Date("2024-01-01T09:00:00");
        const updatedTime = new Date("2024-01-01T10:00:00");
        const item = {
          medicationSpecification: { name: "Test Medication" },
          startDate: new Date(),
          endDate: new Date(),
          reminder: { enabled: true, reminderTimes: [{ time: initialTime }] },
        };
      
        const { getByText, getByTestId } = render(
          <MedicationItemExpanded
            item={item}
            toggleExpand={jest.fn()}
            onToggleReminder={jest.fn()}
            onUpdateReminderTimes={mockOnUpdateReminderTimes}
          />
        );
      
        // Locate and press the existing reminder time to open the DateTimePicker
        fireEvent.press(getByText(initialTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })));
      
        // Wait for DateTimePicker to appear
        await waitFor(() => expect(getByTestId("time-picker")).toBeTruthy());
      
        // Simulate changing the time in the DateTimePicker
        fireEvent(getByTestId("time-picker"), "onChange", {
          type: "set",
          nativeEvent: { timestamp: updatedTime.getTime() },
        });
      
        // Validate that onUpdateReminderTimes is called with the updated reminder time
        expect(mockOnUpdateReminderTimes).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ time: updatedTime })])
        );
      });

      it('adds a new reminder time', async () => {
        const mockOnUpdateReminderTimes = jest.fn();
        const item = {
            medicationSpecification: { name: "Test Medication" },
            startDate: new Date(),
            endDate: new Date(),
            reminder: { enabled: true, reminderTimes: [] },
        };
    
        const { getByTestId } = render(
            <MedicationItemExpanded
                item={item}
                toggleExpand={jest.fn()}
                onToggleReminder={jest.fn()}
                onUpdateReminderTimes={mockOnUpdateReminderTimes}
            />
        );
    
        fireEvent.press(getByTestId("add-reminder-button"));
        await waitFor(() => expect(getByTestId("time-picker")).toBeTruthy());
    
        fireEvent(getByTestId("time-picker"), "onChange", {
            type: "set",
            nativeEvent: { timestamp: new Date("2024-01-01T09:00:00").getTime() },
        });
    
        expect(mockOnUpdateReminderTimes).toHaveBeenCalledWith(
            expect.arrayContaining([{ time: new Date("2024-01-01T09:00:00") }])
        );
    });
    
    it('deletes an existing reminder time', () => {
      const mockOnUpdateReminderTimes = jest.fn();
      const initialTime = new Date("2024-01-01T09:00:00");
      const item = {
          medicationSpecification: { name: "Test Medication" },
          startDate: new Date(),
          endDate: new Date(),
          reminder: { enabled: true, reminderTimes: [{ time: initialTime }] },
      };
  
      const { queryAllByTestId } = render(
          <MedicationItemExpanded
              item={item}
              toggleExpand={jest.fn()}
              onToggleReminder={jest.fn()}
              onUpdateReminderTimes={mockOnUpdateReminderTimes}
          />
      );
  
      fireEvent.press(queryAllByTestId("delete-reminder-button")[0]);
  
      expect(mockOnUpdateReminderTimes).toHaveBeenCalledWith([]);
  });
  
      
      
});