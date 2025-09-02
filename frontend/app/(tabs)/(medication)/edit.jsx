import React, { useState, useEffect } from 'react';
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
import { scheduleReminders, cancelScheduledReminders } from '../../../services/Scheduler';

const EditMedicationScreen = () => {
  const { updateMedication, deleteMedication, showLoading, hideLoading, showError, loadMedications } = useApp();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // Parse medication data from route params
  const medicationData = params.medicationData ? JSON.parse(params.medicationData) : null;
  
  if (!medicationData) {
    Alert.alert('Error', 'No medication data found');
    router.back();
    return null;
  }

  // Form state initialized with existing medication data
  const [formData, setFormData] = useState({
    name: '',
    dosage: { amount: '', unit: 'mg' },
    frequency: '1',
    frequencyUnit: 'day',
    startDate: new Date(),
    endDate: null,
    reminderTimes: [],
    reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    purpose: '',
    directions: '',
    warning: '',
    sideEffects: [],
    newSideEffect: ''
  });

  // Additional state for date pickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize form data with medication data
  useEffect(() => {
    if (medicationData) {
      // Convert reminder times to Date objects if they're strings
      let reminderTimes = [];
      if (medicationData.reminder?.times) {
        reminderTimes = medicationData.reminder.times.map(time => {
          if (time instanceof Date) {
            return time;
          } else if (typeof time === 'string') {
            // Handle different string formats
            if (time.includes(':')) {
              // Time format like "14:30" or "14:30:00"
              const [hours, minutes, seconds] = time.split(':');
              const date = new Date();
              date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
              return date;
            } else {
              // ISO string or other date string
              return new Date(time);
            }
          }
          return new Date(); // fallback
        });
      }

      setFormData({
        name: medicationData.medicationSpecification?.name || medicationData.name || '',
        dosage: {
          amount: medicationData.dosage?.amount || medicationData.dosage_amount || '',
          unit: medicationData.dosage?.unit || medicationData.dosage_unit || 'mg'
        },
        frequency: medicationData.frequency || '1',
        frequencyUnit: 'day',
        startDate: medicationData.start_date ? new Date(medicationData.start_date) : new Date(),
        endDate: medicationData.end_date ? new Date(medicationData.end_date) : null,
        reminderTimes: reminderTimes,
        reminderDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        purpose: medicationData.medicationSpecification?.purpose || medicationData.purpose || '',
        directions: medicationData.medicationSpecification?.directions || medicationData.directions || '',
        warning: medicationData.medicationSpecification?.warnings || medicationData.warnings || '',
        sideEffects: medicationData.medicationSpecification?.sideEffects || medicationData.side_effects || [],
        newSideEffect: ''
      });
      
      setReminderEnabled(medicationData.reminder?.enabled || false);
    }
  }, [medicationData]);

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

  const handleUpdatePlan = async () => {
    if (!validateForm()) {
      return;
    }

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
        dosage: {
          amount: formData.dosage.amount,
          unit: formData.dosage.unit,
        },
        frequency: formData.frequency,
        start_date: formData.startDate?.toISOString(),
        end_date: formData.endDate?.toISOString(),
        reminder: {
          enabled: reminderEnabled,
          times: formData.reminderTimes,
          reminderTimes: formData.reminderTimes.map(time => ({ time })),
        },
        userId: user?.id,
      };

      // Cancel existing reminders
      if (medicationData.id) {
        await cancelScheduledReminders(medicationData.id);
      }

      // Update medication in database
      const result = await updateMedication(medicationData.id, updatedMedicationPlan);
      
      if (result.error) {
        showError(result.error);
        return;
      }

      // Schedule new reminders if enabled
      if (reminderEnabled && formData.reminderTimes.length > 0) {
        await scheduleReminders(
          result.id || medicationData.id,
          formData.name,
          formData.reminderTimes,
          formData.reminderDays
        );
      }

      // Reload medications to refresh the list
      await loadMedications();

      Alert.alert(
        'Success',
        'Medication plan updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

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
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              showLoading();
              
              // Cancel existing reminders
              await cancelScheduledReminders(medicationData.id);
              
              // Delete medication from database
              const result = await deleteMedication(medicationData.id);
              
              if (result.error) {
                showError(result.error);
                return;
              }

              // Reload medications to refresh the list
              await loadMedications();

              Alert.alert(
                'Success',
                'Medication deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );

            } catch (error) {
              console.error('Error deleting medication:', error);
              showError('Failed to delete medication. Please try again.');
            } finally {
              hideLoading();
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-800 p-3 rounded-2xl"
          >
            <icons.ArrowLeft size={20} color="#ffffff" />
          </TouchableOpacity>
          
          <Text className="text-white text-xl font-semibold">Edit Medication</Text>
          
          <TouchableOpacity
            onPress={handleDeletePlan}
            className="bg-red-600 p-3 rounded-2xl"
          >
            <icons.Trash size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="px-6">
          {/* Medication Name */}
          <View className="mb-6">
            <FormField
              title="Medication Name"
              value={formData.name}
              handleChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter medication name"
              error={errors.name}
            />
          </View>

          {/* Dosage Section */}
          <DosageSection
            dosage={formData.dosage}
            onDosageChange={(dosage) => setFormData(prev => ({ ...prev, dosage }))}
            error={errors.dosage}
          />

          {/* Date Picker Section */}
          <DatePickerSection
            startDate={formData.startDate}
            endDate={formData.endDate}
            showStartDatePicker={showStartDatePicker}
            showEndDatePicker={showEndDatePicker}
            onStartDateChange={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
            onEndDateChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
            setShowStartDatePicker={setShowStartDatePicker}
            setShowEndDatePicker={setShowEndDatePicker}
            frequency={formData.frequency}
            frequencyUnit={formData.frequencyUnit}
            onFrequencyChange={(frequency) => setFormData(prev => ({ ...prev, frequency }))}
            onFrequencyUnitChange={(unit) => setFormData(prev => ({ ...prev, frequencyUnit: unit }))}
          />

          {/* Reminder Section */}
          <ReminderSection
            reminderEnabled={reminderEnabled}
            reminderTimes={formData.reminderTimes}
            reminderDays={formData.reminderDays}
            showTimePicker={showTimePicker}
            onReminderEnabledChange={setReminderEnabled}
            onReminderTimesChange={(times) => setFormData(prev => ({ ...prev, reminderTimes: times }))}
            onReminderDaysChange={(days) => setFormData(prev => ({ ...prev, reminderDays: days }))}
            setShowTimePicker={setShowTimePicker}
          />

          {/* Additional Info Section */}
          <AdditionalInfoSection
            purpose={formData.purpose}
            directions={formData.directions}
            warning={formData.warning}
            onPurposeChange={(text) => setFormData(prev => ({ ...prev, purpose: text }))}
            onDirectionsChange={(text) => setFormData(prev => ({ ...prev, directions: text }))}
            onWarningChange={(text) => setFormData(prev => ({ ...prev, warning: text }))}
          />

          {/* Side Effects Section */}
          <SideEffectsSection
            sideEffects={formData.sideEffects}
            newSideEffect={formData.newSideEffect}
            onSideEffectsChange={(effects) => setFormData(prev => ({ ...prev, sideEffects: effects }))}
            onNewSideEffectChange={(text) => setFormData(prev => ({ ...prev, newSideEffect: text }))}
          />

          {/* Action Buttons */}
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditMedicationScreen;
