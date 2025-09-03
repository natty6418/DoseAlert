import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Switch, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { icons } from '../constants';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { deleteSchedulesForMedication, addSchedule } from '../services/Scheduler';

const MedicationItemExpanded = ({ item, toggleExpand, onMedicationUpdate }) => {
  const { updateMedication, loadMedications } = useApp();
  const { user } = useAuth();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedReminderIndex, setSelectedReminderIndex] = useState(null);
  const [reminderTimes, setReminderTimes] = useState(item.reminder?.times || []);
  const [reminderEnabled, setReminderEnabled] = useState(item.reminder?.enabled || false);
  const [selectedDays, setSelectedDays] = useState(item.schedule?.daysOfWeek ? item.schedule.daysOfWeek.split(',') : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  const daysOfWeek = [
    { short: 'Mon', full: 'Monday' },
    { short: 'Tue', full: 'Tuesday' },
    { short: 'Wed', full: 'Wednesday' },
    { short: 'Thu', full: 'Thursday' },
    { short: 'Fri', full: 'Friday' },
    { short: 'Sat', full: 'Saturday' },
    { short: 'Sun', full: 'Sunday' }
  ];

  useEffect(() => {
    setReminderTimes(item.reminder?.times || []);
    setReminderEnabled(item.reminder?.enabled || false);
  }, [item]);

  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate && event.type === 'set') {
      if (selectedReminderIndex !== null) {
        const updatedTimes = [...reminderTimes];
        updatedTimes[selectedReminderIndex] = selectedDate;
        setReminderTimes(updatedTimes);
        setSelectedReminderIndex(null);
      } else {
        setReminderTimes([...reminderTimes, selectedDate]);
      }
    }
  };

  const removeReminderTime = (index) => {
    const updatedTimes = reminderTimes.filter((_, i) => i !== index);
    setReminderTimes(updatedTimes);
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleSaveChanges = async () => {
    try {
      const updatedMedication = {
        ...item,
        reminder: {
          enabled: reminderEnabled,
          times: reminderTimes
        },
      };

      await updateMedication(item.id, updatedMedication);

      await deleteSchedulesForMedication(item.id);

      if (reminderEnabled && reminderTimes.length > 0 && user?.id) {
        for (const reminderTime of reminderTimes) {
          const schedule = {
            medication_id: item.id,
            time_of_day: new Date(reminderTime).toTimeString().split(' ')[0],
            days_of_week: selectedDays.join(','),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            active: true,
            reminderEnabled: reminderEnabled,
          };
          await addSchedule(user.id, schedule);
        }
      }
      
      await loadMedications();
      
      if (onMedicationUpdate) {
        onMedicationUpdate(updatedMedication);
      }
      
      Alert.alert('Success', 'Medication updated successfully!');
    } catch (error) {
      console.error('Error updating medication:', error);
      Alert.alert('Error', 'Failed to update medication. Please try again.');
    }
  };

  const isActive = item.isActive;
  const currentDate = new Date();
  const endDate = item.end_date ? new Date(item.end_date) : null;
  const isExpired = endDate && endDate < currentDate;

  return (
    <View className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
      <TouchableOpacity 
        onPress={toggleExpand} 
        className="flex-row items-center p-4 bg-gray-750"
      >
        <View className="flex-row items-center mr-4">
          <View className={`w-3 h-3 rounded-full mr-3 ${
            isActive && !isExpired ? 'bg-green-400' : 'bg-gray-500'
          }`} />
          <View className={`p-3 rounded-xl ${
            isActive && !isExpired ? 'bg-blue-600' : 'bg-gray-600'
          }`}>
            <Image
              source={icons.pill}
              resizeMode="contain"
              tintColor="#FFF"
              className="w-6 h-6"
            />
          </View>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-psemibold text-white">
              {item.medicationSpecification?.name || item.name || 'Unknown Medication'}
            </Text>
            {isExpired && (
              <View className="bg-red-500 px-2 py-1 rounded-full">
                <Text className="text-white text-xs font-pmedium">Expired</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row items-center mb-2">
            <Text className="text-sm font-pregular text-gray-300">
              {item.dosage?.amount && item.dosage?.unit 
                ? `${item.dosage.amount} ${item.dosage.unit}` 
                : item.dosage_amount && item.dosage_unit
                ? `${item.dosage_amount} ${item.dosage_unit}`
                : 'No dosage specified'}
            </Text>
            <Text className="text-sm font-pregular mx-2 text-gray-300">•</Text>
            <Text className="text-sm font-pregular text-gray-300">
              {item.frequency || 'No frequency set'}
            </Text>
          </View>

          <View className="flex-row items-center">
            <icons.Calendar color="#9CA3AF" size={14} />
            <Text className="text-xs font-pregular ml-1 text-gray-400">
              {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'No start date'} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing'}
            </Text>
          </View>
        </View>

        <View className="items-center ml-3">
          {reminderEnabled && (
            <View className="mb-2">
              <icons.Bell color="#10B981" size={20} />
            </View>
          )}
          <View className="p-1 rounded-full bg-gray-700">
            <icons.ChevronDown color="#6366F1" size={16} />
          </View>
        </View>
      </TouchableOpacity>

      <View className="p-4 bg-gray-800">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-psemibold text-white">Reminders</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: '#374151', true: '#6366F1' }}
                thumbColor={reminderEnabled ? '#FFF' : '#9CA3AF'}
              />
            </View>

            {reminderEnabled && (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-pmedium text-gray-300 mb-3">
                    Reminder Days
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {daysOfWeek.map((day) => (
                      <TouchableOpacity
                        key={day.short}
                        onPress={() => toggleDay(day.short)}
                        className={`px-3 py-2 rounded-lg border ${
                          selectedDays.includes(day.short)
                            ? 'bg-blue-600 border-blue-500'
                            : 'bg-gray-700 border-gray-600'
                        }`}
                        accessibilityState={{ selected: selectedDays.includes(day.short) }}
                      >
                        <Text className={`text-sm font-pmedium ${
                          selectedDays.includes(day.short) ? 'text-white' : 'text-gray-400'
                        }`}>
                          {day.short}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-pmedium text-gray-300 mb-3">
                    Reminder Times
                  </Text>
                  
                  <View className="flex-row flex-wrap gap-2">
                    {reminderTimes.map((time, index) => (
                      <View
                        key={index}
                        className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedReminderIndex(index);
                            setShowTimePicker(true);
                          }}
                          className="mr-3"
                        >
                          <Text className="font-pmedium text-white">
                            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => removeReminderTime(index)}
                          className="p-1"
                        >
                          <icons.XMark color="#ef4444" size={16} />
                        </TouchableOpacity>
                      </View>
                    ))}

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedReminderIndex(null);
                        setShowTimePicker(true);
                      }}
                      className="flex-row items-center justify-center px-4 py-2 border-2 border-dashed border-blue-600 bg-gray-700 rounded-lg min-w-[80px]"
                    >
                      <icons.PlusCircle color="#6366F1" size={20} />
                      <Text className="text-blue-400 text-sm font-pmedium ml-2">Add Time</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-lg font-psemibold text-white mb-4">Information</Text>
            
            {item.medicationSpecification?.purpose && (
              <View className="mb-3">
                <Text className="text-sm font-pmedium text-gray-400 mb-1">Purpose</Text>
                <Text className="text-sm text-gray-300">{item.medicationSpecification.purpose}</Text>
              </View>
            )}

            {item.medicationSpecification?.directions && (
              <View className="mb-3">
                <Text className="text-sm font-pmedium text-gray-400 mb-1">Directions</Text>
                <Text className="text-sm text-gray-300">{item.medicationSpecification.directions}</Text>
              </View>
            )}

            {item.medicationSpecification?.warnings && (
              <View className="mb-3">
                <Text className="text-sm font-pmedium text-gray-400 mb-1">Warnings</Text>
                <Text className="text-sm text-red-400">{item.medicationSpecification.warnings}</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-3 mb-3">
            <TouchableOpacity
              onPress={handleSaveChanges}
              className="flex-1 bg-blue-600 py-3 px-4 rounded-lg flex-row items-center justify-center"
            >
              <icons.CheckCircle color="#FFF" size={20} />
              <Text className="text-white font-psemibold ml-2">Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={toggleExpand}
              className="bg-gray-700 py-3 px-4 rounded-lg flex-row items-center justify-center"
            >
              <icons.XMark color="#9CA3AF" size={20} />
              <Text className="text-gray-300 font-pmedium ml-2">Cancel</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: '/(tabs)/(medication)/edit',
                params: {
                  medicationData: JSON.stringify(item)
                }
              });
            }}
            className="bg-secondary py-3 px-4 rounded-lg flex-row items-center justify-center"
          >
            <icons.Pencil color="#1f2937" size={20} />
            <Text className="text-primary font-psemibold ml-2">Edit Medication Details</Text>
          </TouchableOpacity>
        </ScrollView>

        {showTimePicker && (
          <DateTimePicker
            value={selectedReminderIndex !== null ? new Date(reminderTimes[selectedReminderIndex]) : new Date()}
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
