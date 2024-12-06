import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { icons } from '../constants';



const MedicationItemExpanded = ({ item, toggleExpand, onToggleReminder, onUpdateReminderTimes }) => {
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [pickerTime, setPickerTime] = useState(null);
    const [selectedReminderIndex, setSelectedReminderIndex] = useState(null); // To track the index of the reminder being edited
    const [reminderTimes, setReminderTimes] = useState(item.reminder.reminderTimes || []);
  
    const handleTimeChange = (event, selectedDate, index=null) => {
      setShowTimePicker(false);
      if (selectedDate && event.type === 'set') {
        if (selectedReminderIndex !== null) {
          // Update the selected reminder time
          const updatedTimes = reminderTimes.map((reminder, index) =>
            index === selectedReminderIndex ? {...reminder, time: selectedDate } : reminder
          );
          setReminderTimes(updatedTimes);
          setSelectedReminderIndex(null); // Reset the selected index
          onUpdateReminderTimes(updatedTimes); // Call the parent update function
        } else {
          // Add a new reminder time
          const updatedTimes = [...reminderTimes, { time: selectedDate }];
          setReminderTimes(updatedTimes);
          onUpdateReminderTimes(updatedTimes); // Call the parent update function
        }
      } else{
        if (index !== null){
          const updatedTimes = reminderTimes.filter((_, i) => i !== index);
          setReminderTimes(updatedTimes);
          onUpdateReminderTimes(updatedTimes);
        }
        console.log("No time selected");
      }
    };
  
    return (
      <View className="p-4 bg-gray-800 mt-2 rounded-lg shadow-lg border border-lime-500">
        {/* Header */}
        <TouchableOpacity onPress={toggleExpand} className="flex-row items-center">
          {/* Pill Icon */}
          <Image
            source={icons.pill}
            resizeMode="contain"
            tintColor="#91D62A"
            className="w-8 h-8 mr-2"
          />
  
          {/* Medication Name and Dates */}
          <View className="flex-1">
            <Text className="text-lime-400 text-xl font-semibold">
              {item.medicationSpecification.name}
            </Text>
            <View className="flex flex-row">
              <Text className="text-gray-300 text-sm">
                {item.startDate.toLocaleDateString()} - {item.endDate.toLocaleDateString()}
              </Text>
            </View>
          </View>
  
          {/* Collapse Icon */}
          <icons.ChevronUp color="#91D62A" size={24} />
        </TouchableOpacity>
  
        {/* Settings */}
        <View className="mt-4">
          {/* Reminder Toggle */}
          <View className="flex-row items-center mb-2">
            <Text className="text-lime-500 font-semibold text-lg">Reminder</Text>
            <Switch
              value={item.reminder.enabled}
              onValueChange={(value) => onToggleReminder(value)}
            />
          </View>
  
          {/* Time Picker */}
          {item.reminder.enabled && (
            <View className="items-center flex-row gap-2 flex-wrap">
              {reminderTimes && reminderTimes.length > 0 && (
                reminderTimes.map(({ time }, index) => (
                  <View
                    key={index}
                    className="w-32 justify-between py-3 px-4 rounded-lg flex-row items-center border-2 border-lime-600"
                  >
                    <TouchableOpacity
                      onPress={() => {
                        setPickerTime(new Date(time)); // Set the time to the existing reminder time
                        setSelectedReminderIndex(index); // Set the selected index for editing
                        setShowTimePicker(true);
                      }}
                    >
                      <Text className="text-lime-500 font-pmedium">
                        {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                                                onPress={() => {
                                                    handleTimeChange({ type: 'set' }, null, index); // Call the update function
                                                }}
                                            >
                                                <icons.XMark color="#ef4444" height={18} width={18} />
                                            </TouchableOpacity>
                  </View>
                ))
              )}
  
              <TouchableOpacity
                onPress={() => {
                  setPickerTime(null); // Clear picker time for adding a new reminder
                  setSelectedReminderIndex(null); // Clear selected index for adding a new reminder
                  setShowTimePicker(true);
                }}
                className="items-center"
                testID={"add-reminder-button"}
              >
                <icons.PlusCircle color="#4caf50" width={32} height={32} />
              </TouchableOpacity>
            </View>
          )}
          {showTimePicker && (
            <DateTimePicker
              value={pickerTime || new Date()}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
      </View>
    );
  };

export default MedicationItemExpanded;