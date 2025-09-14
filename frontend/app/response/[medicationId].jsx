
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Check, X  } from 'lucide-react-native';
import { recordAdherence } from '../../services/AdherenceTracker';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';

const MedicationResponse = () => {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { medications } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);
  const [medication, setMedication] = useState(null);

  // Find the medication details
  useEffect(() => {
    const foundMedication = medications.find(med => med.id.toString() === params.medicationId);
    setMedication(foundMedication);
  }, [medications, params.medicationId]);

  const handleResponse = async (action) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    try {
      const status = action === 'taken' ? 'taken' : 'missed';
      const scheduledTime = params.scheduledTime || new Date().toISOString();
      
      console.log(`User selected: ${action}`);
      
      // Record adherence in the database
      await recordAdherence(
        user?.id || 1, // Use guest user ID as fallback
        params.medicationId,
        status,
        scheduledTime,
        new Date().toISOString(), // actualTime
        `User response: ${action}`, // notes
        params.reminderId
      );
      
      console.log('✅ Adherence recorded successfully');
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('❌ Failed to record adherence:', error);
      // Still navigate home even if tracking fails
      router.replace('/(tabs)/home');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 justify-center items-center px-5">
        {/* Header with pill icon */}
        <View className="items-center mb-12">
          
          <Text className="text-white text-2xl font-pbold text-center">
            Did you take your medication?
          </Text>
        </View>
        
        {/* Medication info */}
        {medication ? (
          <View className="bg-black-100 rounded-xl p-6 mb-8 w-full">
            <Text className="text-secondary text-center font-pbold text-xl mb-2">
              {medication.name}
            </Text>
            <Text className="text-white text-center font-pmedium">
              {medication.dosage_amount} {medication.dosage_unit}
            </Text>
            {medication.directions && (
              <Text className="text-gray-300 text-center font-pregular text-sm mt-2">
                {medication.directions}
              </Text>
            )}
          </View>
        ) : (
          <View className="bg-black-100 rounded-xl p-4 mb-8 w-full">
            <Text className="text-secondary text-center font-pmedium">
              Loading medication details...
            </Text>
          </View>
        )}

        {/* Action buttons with icons */}
        <View className="w-full flex-row justify-between items-center px-8">
          {/* Missed Button - Left Circle */}
          <TouchableOpacity
            onPress={() => handleResponse('missed')}
            disabled={isProcessing}
            className={`${isProcessing ? 'bg-gray-600' : 'bg-red-500'} w-32 h-32 rounded-full items-center justify-center`}
          >
            <X size={48} color="white" strokeWidth={3} />
          </TouchableOpacity>

          {/* Taken Button - Right Circle */}
          <TouchableOpacity
            onPress={() => handleResponse('taken')}
            disabled={isProcessing}
            className={`${isProcessing ? 'bg-gray-600' : 'bg-green-500'} w-32 h-32 rounded-full items-center justify-center`}
          >
            <Check size={48} color="white" strokeWidth={3} />
          </TouchableOpacity>
        </View>

        {/* Labels below circles */}
        <View className="w-full flex-row justify-between items-center px-8 mt-6">
          <Text className="text-white text-lg font-pbold text-center w-32">
            {isProcessing ? 'Processing...' : 'Missed'}
          </Text>
          <Text className="text-white text-lg font-pbold text-center w-32">
            {isProcessing ? 'Processing...' : 'Taken'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MedicationResponse;
