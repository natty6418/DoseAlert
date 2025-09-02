import React, { useState } from 'react';
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
import { addSchedule } from '../../../services/Scheduler';
import { scheduleReminders } from '../../../services/Scheduler';

const AddMedicationScreen = () => {
  const { addMedication, showLoading, hideLoading, showError, loadMedications } = useApp();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // Parse medication data from route params if available
  const scannedData = params.medicationData ? JSON.parse(params.medicationData) : null;
  const returnPath = params.returnPath || '/(tabs)/(medication)/create';

  // Form state
  const [formData, setFormData] = useState({
    name: scannedData?.name || 'Ibuprofen',
    dosage: {
      amount: scannedData?.dosage || '200',
      unit: 'mg'
    },
    frequency: '2',
    frequencyUnit: 'day',
    startDate: new Date(),
    endDate: null,
    reminderTimes: [
      // Create a Date object for 8:00 AM today
      new Date(new Date().setHours(8, 0, 0, 0)),
      // Create a Date object for 8:00 PM today
      new Date(new Date().setHours(20, 0, 0, 0))
    ],
    reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], // Default to daily
    purpose: 'Pain relief and inflammation reduction',
    directions: scannedData?.directions || 'Take with food or milk to prevent stomach upset. Do not exceed recommended dose.',
    warning: scannedData?.warnings || 'Do not use if allergic to NSAIDs. Consult doctor if pregnant or breastfeeding.',
    sideEffects: scannedData?.sideEffects ? 
      scannedData.sideEffects.map(effect => ({ term: effect, checked: false })) : [
        { term: 'Stomach upset', checked: false },
        { term: 'Dizziness', checked: false },
        { term: 'Headache', checked: false }
      ],
    newSideEffect: ''
  });

  // Additional state for date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Medication name is required';
    }
    
    if (!formData.dosage.amount.trim()) {
      newErrors.dosage = 'Dosage amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePlan = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      showLoading();
      
      const medicationPlan = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        // Structure the data to match what create.jsx expects
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
        // Also keep flat structure for compatibility
        name: formData.name,
        directions: formData.directions,
        side_effects: formData.sideEffects,
        purpose: formData.purpose,
        warnings: formData.warning,
        dosage_amount: formData.dosage.amount,
        dosage_unit: formData.dosage.unit,
      };

      // Save the medication first
      const savedMedication = await addMedication(medicationPlan);
      
      // If reminders are enabled, create schedules and notifications
      if (reminderEnabled && formData.reminderTimes.length > 0 && user?.id) {
        try {
          // Create schedule entries for each reminder time
          for (const reminderTime of formData.reminderTimes) {
            const schedule = {
              medication_id: savedMedication.id,
              time_of_day: reminderTime.toTimeString().split(' ')[0], // Convert to HH:mm:ss format
              days_of_week: formData.reminderDays.join(','), // Use user-selected days
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              active: true,
              reminderEnabled: reminderEnabled // Use the reminderEnabled state variable
            };
            
            await addSchedule(user.id, schedule);
          }
          
          // Schedule local notifications
          const reminderMessage = `Time to take your ${formData.name} (${formData.dosage.amount}${formData.dosage.unit})`;
          await scheduleReminders(formData.reminderTimes, reminderMessage, savedMedication.id);
          
          console.log(`Created ${formData.reminderTimes.length} reminder schedules and notifications`);
          
          // Refresh the medications list to include the updated reminder data
          await loadMedications();
        } catch (reminderError) {
          console.error('Error setting up reminders:', reminderError);
          // Don't fail the entire operation if reminders fail
          // But inform the user
          Alert.alert(
            'Medication Saved',
            'Your medication was saved successfully, but there was an issue setting up reminders. You can set them up later.',
            [{ text: 'OK', onPress: () => router.push(returnPath) }]
          );
          return;
        }
      }
      
      // Refresh the medications list to ensure it's up to date
      await loadMedications();
      
      Alert.alert(
        'Success',
        'Medication plan saved successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.push(returnPath)
          }
        ]
      );
    } catch (error) {
      showError('Failed to save medication plan. Please try again.');
      console.error('Error saving medication plan:', error);
    } finally {
      hideLoading();
    }
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: null
      }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary ">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-primary border-b border-gray-700">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <icons.ArrowLeft size={24} color="#c0ee77" />
        </TouchableOpacity>
        
        <Text className="text-white text-lg font-psemibold">
          Add Medication
        </Text>
        
        <TouchableOpacity 
          onPress={handleSavePlan}
          className="bg-secondary-200 rounded-lg px-4 py-2"
        >
          <Text className="text-white font-psemibold">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Basic Information */}
        <View className="bg-primary rounded-2xl p-4 mb-4">
          <Text className="text-secondary font-pmedium text-lg mb-3">
            Basic Information
          </Text>
          
          <FormField
            title="Medication Name"
            value={formData.name}
            placeholder="Enter medication name"
            handleChangeText={(value) => updateFormData('name', value)}
            required={true}
          />
          {errors.name && (
            <Text className="text-red-500 text-xs mt-1">{errors.name}</Text>
          )}
        </View>

        {/* Dosage Section */}
        <DosageSection
          dosage={formData.dosage}
          onDosageChange={(value) => updateFormData('dosage', value)}
        />
        {errors.dosage && (
          <Text className="text-red-500 text-xs mt-1 mb-4">{errors.dosage}</Text>
        )}

        {/* Date Picker Section */}
        <DatePickerSection
          startDate={formData.startDate}
          endDate={formData.endDate}
          showStartDatePicker={showStartDatePicker}
          showEndDatePicker={showEndDatePicker}
          onStartDatePress={() => setShowStartDatePicker(true)}
          onEndDatePress={() => setShowEndDatePicker(true)}
          onStartDateChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) updateFormData('startDate', date);
          }}
          onEndDateChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) updateFormData('endDate', date);
          }}
        />

        {/* Reminder Section */}
        <ReminderSection
          reminderEnabled={reminderEnabled}
          reminderTimes={formData.reminderTimes}
          reminderDays={formData.reminderDays}
          showTimePicker={showTimePicker}
          onToggleReminder={() => setReminderEnabled(!reminderEnabled)}
          onRemoveReminderTime={(index) => {
            const newTimes = formData.reminderTimes.filter((_, i) => i !== index);
            updateFormData('reminderTimes', newTimes);
          }}
          onReminderDaysChange={(days) => updateFormData('reminderDays', days)}
          onShowTimePicker={() => setShowTimePicker(true)}
          onTimePickerChange={(event, time) => {
            setShowTimePicker(false);
            if (time) {
              // Add the new time as a Date object
              updateFormData('reminderTimes', [...formData.reminderTimes, time]);
            }
          }}
        />

        {/* Additional Information */}
        <AdditionalInfoSection
          purpose={formData.purpose}
          directions={formData.directions}
          warning={formData.warning}
          onPurposeChange={(value) => updateFormData('purpose', value)}
          onDirectionsChange={(value) => updateFormData('directions', value)}
          onWarningChange={(value) => updateFormData('warning', value)}
        />

        {/* Side Effects */}
        <SideEffectsSection
          sideEffects={formData.sideEffects}
          newSideEffect={formData.newSideEffect}
          onSideEffectsChange={(value) => updateFormData('sideEffects', value)}
          onNewSideEffectChange={(value) => updateFormData('newSideEffect', value)}
          onAddSideEffect={() => {
            if (formData.newSideEffect.trim()) {
              const newSideEffect = { term: formData.newSideEffect.trim(), checked: false };
              updateFormData('sideEffects', [...formData.sideEffects, newSideEffect]);
              updateFormData('newSideEffect', '');
            }
          }}
        />

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddMedicationScreen;
