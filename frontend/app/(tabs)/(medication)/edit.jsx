import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { icons } from '../../../constants';
import {
  DatePickerSection,
  DosageSection,
  ReminderSection,
  AdditionalInfoSection,
  SideEffectsSection
} from '../../../components/AddMedication';
import FormField from '../../../components/FormField';
import { scheduleReminders, cancelScheduledReminders, addSchedule, deleteSchedulesForMedication } from '../../../services/Scheduler';

const EditMedicationScreen = () => {
  const { updateMedication, deleteMedication, showLoading, hideLoading, showError, loadMedications } = useApp();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const medicationData = params.medicationData ? JSON.parse(params.medicationData) : null;

  if (!medicationData) {
    Alert.alert('Error', 'No medication data found');
    router.back();
    return null;
  }

  const parseReminderTimes = (times) => {
    if (!times) return [];
    
    return times.map(time => {
      // If it's already a Date object, return it as-is
      if (time instanceof Date) {
        return time;
      }
      
      if (typeof time === 'string') {
        // Check if it's an ISO string (from JSON serialization of Date objects)
        if (time.includes('T') && time.includes('Z') || time.includes('+')) {
          const parsedDate = new Date(time);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
        
        // If it's a time string in HH:MM:SS or HH:MM format
        if (time.includes(':')) {
          const timeParts = time.split(':');
          const hours = parseInt(timeParts[0], 10) || 0;
          const minutes = parseInt(timeParts[1], 10) || 0;
          const seconds = parseInt(timeParts[2], 10) || 0;
          
          // Create a date for today with the specific time
          const date = new Date();
          date.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
          date.setHours(hours, minutes, seconds, 0);
          
          return date;
        }
        
        // Try to parse as any other string format
        const parsedDate = new Date(time);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // If it's an object with a time property (from some data structures)
      if (time && time.time instanceof Date) {
        return time.time;
      }
      
      // Fallback to 8 AM
      console.warn('Could not parse reminder time:', time);
      const fallbackDate = new Date();
      fallbackDate.setHours(8, 0, 0, 0);
      return fallbackDate;
    });
  };

  const [formData, setFormData] = useState({
    name: medicationData.medicationSpecification?.name || medicationData.name || '',
    dosage: {
      amount: medicationData.dosage?.amount || medicationData.dosage_amount || '',
      unit: medicationData.dosage?.unit || medicationData.dosage_unit || 'mg'
    },
    frequency: medicationData.frequency || '1',
    frequencyUnit: 'day',
    startDate: medicationData.start_date ? new Date(medicationData.start_date) : new Date(),
    endDate: medicationData.end_date ? new Date(medicationData.end_date) : null,
    reminderTimes: parseReminderTimes(medicationData.reminder?.times),
    reminderDays: medicationData.schedule?.daysOfWeek ? medicationData.schedule.daysOfWeek.split(',') : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    purpose: medicationData.medicationSpecification?.purpose || medicationData.purpose || '',
    directions: medicationData.medicationSpecification?.directions || medicationData.directions || '',
    warning: medicationData.medicationSpecification?.warnings || medicationData.warnings || '',
    sideEffects: medicationData.medicationSpecification?.sideEffects || medicationData.side_effects || [],
    newSideEffect: ''
  });

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(medicationData.reminder?.enabled || false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Medication name is required';
    if (reminderEnabled && formData.reminderDays.length === 0) {
      newErrors.reminderDays = 'Please select at least one day for reminders.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePlan = async () => {
    if (!validateForm()) return;
    try {
      showLoading();
      const updatedMedicationPlan = {
        id: medicationData.id,
        createdAt: medicationData.createdAt,
        isActive: true,
        medicationSpecification: {
          name: formData.name,
          directions: formData.directions,
          sideEffects: formData.sideEffects,
          purpose: formData.purpose,
          warnings: formData.warning,
        },
        dosage: formData.dosage,
        frequency: formData.frequency,
        frequencyUnit: formData.frequencyUnit,
        start_date: formData.startDate.toISOString(),
        end_date: formData.endDate ? formData.endDate.toISOString() : null,
        reminder: {
          enabled: reminderEnabled,
          times: formData.reminderTimes,
        },
        name: formData.name,
        directions: formData.directions,
        side_effects: formData.sideEffects,
        purpose: formData.purpose,
        warnings: formData.warning,
        dosage_amount: formData.dosage.amount,
        dosage_unit: formData.dosage.unit,
      };

      // First, cancel existing reminders and schedules
      await cancelScheduledReminders(medicationData.id);
      await deleteSchedulesForMedication(medicationData.id);

      // Update the medication data
      const result = await updateMedication(medicationData.id, updatedMedicationPlan);
      if (result.error) {
        showError(result.error);
        return;
      }

      // Only create new reminders and schedules if reminders are enabled
      if (reminderEnabled && formData.reminderTimes.length > 0 && user?.id) {
        try {
          // Create new schedules for each reminder time
          for (const reminderTime of formData.reminderTimes) {
            // Ensure we're using the correct time format (HH:MM:SS)
            const timeString = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}:00`;
            
            const schedule = {
              medication_id: medicationData.id,
              time_of_day: timeString,
              days_of_week: formData.reminderDays.join(','),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              active: true,
              reminderEnabled: true,
            };
            await addSchedule(user.id, schedule);
          }

          // Schedule the actual notifications
          const reminderMessage = `Time to take your ${formData.name} (${formData.dosage.amount}${formData.dosage.unit})`;
          await scheduleReminders(formData.reminderTimes, reminderMessage, medicationData.id);
        } catch (reminderError) {
          console.error('Error setting up reminders during edit:', reminderError);
          Alert.alert(
            'Medication Updated',
            'Your medication was updated successfully, but there was an issue setting up reminders. You can edit them again later.',
            [{ text: 'OK' }]
          );
        }
      }

      await loadMedications();

      Alert.alert('Success', 'Medication plan updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating medication plan:', error);
      showError('Failed to update medication plan. Please try again.');
    } finally {
      hideLoading();
    }
  };

  const handleDeletePlan = async () => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              showLoading();
              await cancelScheduledReminders(medicationData.id);
              await deleteMedication(medicationData.id);
              await loadMedications();
              Alert.alert('Success', 'Medication deleted successfully!', [
                { text: 'OK', onPress: () => router.push('/(tabs)/home') },
              ]);
            } catch (error) {
              console.error('Error deleting medication:', error);
              showError('Failed to delete medication. Please try again.');
            } finally {
              hideLoading();
            }
          },
        },
      ]
    );
  };

  const updateFormData = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  }, [errors]);

  const onStartDateChange = useCallback((event, date) => {
    setShowStartDatePicker(false);
    if (date) updateFormData('startDate', date);
  }, [updateFormData]);

  const onEndDateChange = useCallback((event, date) => {
    setShowEndDatePicker(false);
    if (date) updateFormData('endDate', date);
  }, [updateFormData]);

  const onToggleReminder = useCallback(() => setReminderEnabled(!reminderEnabled), [reminderEnabled]);

  const onRemoveReminderTime = useCallback((index) => {
    const newTimes = formData.reminderTimes.filter((_, i) => i !== index);
    updateFormData('reminderTimes', newTimes);
  }, [formData.reminderTimes, updateFormData]);

  const onReminderDaysChange = useCallback((days) => updateFormData('reminderDays', days), [updateFormData]);

  const onShowTimePicker = useCallback(() => setShowTimePicker(true), []);

  const onTimePickerChange = useCallback((event, time) => {
    setShowTimePicker(false);
    if (time) {
      updateFormData('reminderTimes', [...formData.reminderTimes, time]);
    }
  }, [formData.reminderTimes, updateFormData]);

  const onAddSideEffect = useCallback(() => {
    if (formData.newSideEffect.trim()) {
      const newSideEffect = { term: formData.newSideEffect.trim(), checked: false };
      updateFormData('sideEffects', [...formData.sideEffects, newSideEffect]);
      updateFormData('newSideEffect', '');
    }
  }, [formData.newSideEffect, formData.sideEffects, updateFormData]);

  const onPurposeChange = useCallback((value) => updateFormData('purpose', value), [updateFormData]);
  const onDirectionsChange = useCallback((value) => updateFormData('directions', value), [updateFormData]);
  const onWarningChange = useCallback((value) => updateFormData('warning', value), [updateFormData]);
  const onSideEffectsChange = useCallback((value) => updateFormData('sideEffects', value), [updateFormData]);
  const onNewSideEffectChange = useCallback((value) => updateFormData('newSideEffect', value), [updateFormData]);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-row items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-800 p-3 rounded-2xl">
          <icons.ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-psemibold">Edit Medication</Text>
        <TouchableOpacity onPress={handleDeletePlan} testID="delete-button" className="bg-red-600 p-3 rounded-2xl">
          <icons.Trash size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 py-4">
        <View className="bg-gray-800 border border-gray-700 rounded-2xl p-5 mb-4">
          <View className="flex-row items-center mb-4">
            <View className="bg-secondary/20 p-2 rounded-xl mr-3">
              <View className="w-5 h-5 bg-secondary rounded-full" />
            </View>
            <Text className="text-white font-psemibold text-lg">Basic Information</Text>
          </View>
          <FormField
            title="Medication Name"
            value={formData.name}
            placeholder="Enter medication name"
            handleChangeText={(value) => updateFormData('name', value)}
            required={true}
          />
          {errors.name && <Text className="text-red-400 text-sm mt-2">{errors.name}</Text>}
        </View>

        <DosageSection
          dosage={formData.dosage}
          onDosageChange={(value) => updateFormData('dosage', value)}
          error={errors.dosage}
        />

        <DatePickerSection
          startDate={formData.startDate}
          endDate={formData.endDate}
          showStartDatePicker={showStartDatePicker}
          showEndDatePicker={showEndDatePicker}
          onStartDatePress={() => setShowStartDatePicker(true)}
          onEndDatePress={() => setShowEndDatePicker(true)}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

        <ReminderSection
          reminderEnabled={reminderEnabled}
          reminderTimes={formData.reminderTimes}
          reminderDays={formData.reminderDays}
          showTimePicker={showTimePicker}
          onToggleReminder={onToggleReminder}
          onRemoveReminderTime={onRemoveReminderTime}
          onReminderDaysChange={onReminderDaysChange}
          onShowTimePicker={onShowTimePicker}
          onTimePickerChange={onTimePickerChange}
        />
        {errors.reminderDays && <Text className="text-red-400 text-sm mt-2">{errors.reminderDays}</Text>}

        <AdditionalInfoSection
          purpose={formData.purpose}
          directions={formData.directions}
          warning={formData.warning}
          onPurposeChange={onPurposeChange}
          onDirectionsChange={onDirectionsChange}
          onWarningChange={onWarningChange}
        />

        <SideEffectsSection
          sideEffects={formData.sideEffects}
          newSideEffect={formData.newSideEffect}
          onSideEffectsChange={onSideEffectsChange}
          onNewSideEffectChange={onNewSideEffectChange}
          onAddSideEffect={onAddSideEffect}
        />
        
        <View className="flex-row space-x-4 mt-8 mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 bg-gray-700 border border-gray-600 py-4 rounded-2xl"
            >
              <Text className="text-white text-center font-psemibold text-lg">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleUpdatePlan}
              className="flex-1 bg-secondary py-4 rounded-2xl"
            >
              <Text className="text-primary text-center font-psemibold text-lg">Update Plan</Text>
            </TouchableOpacity>
          </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditMedicationScreen;