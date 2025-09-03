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
import { addSchedule } from '../../../services/Scheduler';
import { scheduleReminders } from '../../../services/Scheduler';

const AddMedicationScreen = () => {
  const { addMedication, showLoading, hideLoading, showError, loadMedications } = useApp();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  const scannedData = params.medicationData ? JSON.parse(params.medicationData) : null;
  const returnPath = params.returnPath || '/(tabs)/(medication)/create';

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
      new Date(new Date().setHours(8, 0, 0, 0)),
      new Date(new Date().setHours(20, 0, 0, 0))
    ],
    reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
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
    if (reminderEnabled && formData.reminderDays.length === 0) {
      newErrors.reminderDays = 'Please select at least one day for reminders.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePlan = async () => {
    if (!validateForm()) return;
    try {
      showLoading();
      const medicationPlan = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
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

      const savedMedication = await addMedication(medicationPlan);
      
      if (reminderEnabled && formData.reminderTimes.length > 0 && user?.id) {
        try {
          for (const reminderTime of formData.reminderTimes) {
            // Ensure we're using the correct time format (HH:MM:SS)
            const timeString = `${reminderTime.getHours().toString().padStart(2, '0')}:${reminderTime.getMinutes().toString().padStart(2, '0')}:00`;
            
            const schedule = {
              medication_id: savedMedication.id,
              time_of_day: timeString,
              days_of_week: formData.reminderDays.join(','),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              active: true,
              reminderEnabled: reminderEnabled
            };
            await addSchedule(user.id, schedule);
          }
          
          const reminderMessage = `Time to take your ${formData.name} (${formData.dosage.amount}${formData.dosage.unit})`;
          await scheduleReminders(formData.reminderTimes, reminderMessage, savedMedication.id);
          
          await loadMedications();
        } catch (reminderError) {
          console.error('Error setting up reminders:', reminderError);
          Alert.alert(
            'Medication Saved',
            'Your medication was saved successfully, but there was an issue setting up reminders. You can set them up later.',
            [{ text: 'OK', onPress: () => router.push(returnPath) }]
          );
          return;
        }
      }
      
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
    <SafeAreaView className="flex-1 bg-primary ">
      <View className="flex-row items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-700">
        <TouchableOpacity onPress={() => router.back()} className="bg-gray-800 p-3 rounded-2xl">
          <icons.ArrowLeft size={20} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-psemibold">Add Medication</Text>
        <TouchableOpacity onPress={handleSavePlan} className="bg-secondary py-3 px-5 rounded-2xl">
          <Text className="text-primary font-psemibold">Save</Text>
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

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddMedicationScreen;