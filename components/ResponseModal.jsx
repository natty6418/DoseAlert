import React from 'react';
import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native';
import { recordAdherence } from '../services/AdherenceTracker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import emailEmergencyContact from '../services/EmergencyServiceHandler';

const ResponseModal = ({id, name, visible, onClose, setAdherenceData, adherenceData}) => {
    const { user } = useFirebaseContext();
    const handleSendEmail = async () => {
        const emergencyInfo = user.emergencyContact;
        if (!emergencyInfo || !emergencyInfo.email) {
          Alert.alert('Error', 'No emergency contact email found.');
          return;
        }
            
        try {
          await emailEmergencyContact(emergencyInfo.email, emergencyInfo.name, name);
          
        } catch (error) {
          console.error('Error sending email:', error);
          Alert.alert('Error', 'Failed to send email.');
        }
      };
      
    const handleConfirm = () => {
            setAdherenceData((prev) => ({
                ...prev,
                [id]: {
                    taken: prev[id]?.taken ? prev[id].taken + 1 : 1,
                    missed: prev[id]?.missed ? prev[id].missed : 0,
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

        setAdherenceData((prev) => ({
            ...prev,
            [id]: {
                taken: prev[id]?.taken ? prev[id].taken : 0,
                missed: prev[id]?.missed ? prev[id].missed + 1 : 1,
                prevMiss: true,
                consecutiveMisses: prev[id]?.prevMiss ? prev[id].consecutiveMisses + 1 : 1,
            },
        }));
        if(adherenceData[id].consecutiveMisses >= 2){
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
                onPress={handleConfirm}
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
