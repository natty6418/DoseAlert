import React from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { recordAdherence } from '../../services/AdherenceTracker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import emailEmergencyContact from '../services/EmergencyServiceHandler';

const ResponseModal = ({id, name, visible, onClose, setAdherenceData, adherenceData}) => {
    const { user } = useAuth();
    const handleSendEmail = async () => {
        // Mock emergency contact for now - would need to get from user profile API
        const emergencyInfo = { email: 'emergency@example.com' };
        if (!emergencyInfo || !emergencyInfo.email) {
          Alert.alert('Error', 'No emergency contact email found.');
          return;
        }
            
        try {
          await emailEmergencyContact(emergencyInfo.email, user?.first_name || 'User', name);
          
        } catch (error) {
          console.error('Error sending email:', error);
          Alert.alert('Error', 'Failed to send email.');
        }
      };
      
    const handleConfirmAdherence = () => {
        // Get current data or use defaults
        const currentData = adherenceData[id] || { taken: 0, missed: 0, prevMiss: false, consecutiveMisses: 0 };
        
        setAdherenceData((prev) => ({
            ...prev,
            [id]: {
                taken: currentData.taken + 1,
                missed: currentData.missed,
                prevMiss: false,
                consecutiveMisses: 0,
            },
        }));
            recordAdherence(id, true).catch((error) => {
                console.error("Error recording adherence:", error);
                Alert.alert('Error', 'Failed to record medication adherence.');
            }
            );
            Alert.alert('Success', 'Medication adherence recorded successfully.');
            onClose();
        
    };
    const handleCancel = () => {
        // Calculate the new consecutive misses count before updating state
        const currentData = adherenceData[id] || { taken: 0, missed: 0, prevMiss: false, consecutiveMisses: 0 };
        const newConsecutiveMisses = currentData.prevMiss ? currentData.consecutiveMisses + 1 : 1;

        setAdherenceData((prev) => ({
            ...prev,
            [id]: {
                taken: currentData.taken,
                missed: currentData.missed + 1,
                prevMiss: true,
                consecutiveMisses: newConsecutiveMisses,
            },
        }));
        
        // Use the calculated value instead of accessing the old adherenceData
        if(newConsecutiveMisses >= 2){
            handleSendEmail();
        }

        recordAdherence(id, false).catch((error) => {
            console.error("Error recording adherence:", error);
            Alert.alert('Error', 'Failed to record medication adherence.');
        }
        );
        Alert.alert('Success', 'Medication adherence recorded successfully.');
        onClose();
    };



  return (
    <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
    >
        <SafeAreaView className="flex-1 bg-gray-900 p-4">
            <View className="flex-1 justify-center items-center">
            <Text className="text-white text-3xl font-bold mb-8">Confirm Medication</Text>
            <Text className="text-gray-300 text-lg mb-8">
                Did you take your medication: {name}?
            </Text>
    
            <View className="flex-row gap-4">
                <TouchableOpacity
                onPress={handleConfirmAdherence}
                className="bg-green-500 px-6 py-3 rounded-lg"
                >
                <Text className="text-white font-bold text-lg">Yes</Text>
                </TouchableOpacity>
    
                <TouchableOpacity
                onPress={handleCancel}
                className="bg-red-500 px-6 py-3 rounded-lg"
                >
                <Text className="text-white font-bold text-lg">No</Text>
                </TouchableOpacity>
            </View>
            </View>
        </SafeAreaView>
    </Modal>
  )
};

export default ResponseModal;
