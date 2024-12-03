import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, BackHandler } from 'react-native';
import { useFirebaseContext } from '../../../contexts/FirebaseContext';
import { updateUserProfile } from '../../../services/firebaseDatabase';
import FormField from '../../../components/FormField';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';


const AccountInfo = () => {
  const { user, setUser } = useFirebaseContext(); // Assume this gets the logged-in user's info
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Fetch user information on component mount
    // Handle Save Changes
    useEffect(() => {
      const handleBackPress = () => {
          // Navigate back to the previous screen (Settings in this case)
          router.push('/settings');
          return true; // Return true to prevent default back behavior
      };
  
      // Add the event listener
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
  
      // Cleanup the event listener on component unmount
      return () => {
          BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      };
  }, []);
  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        uid: user.id,
        newFirstName,
        newLastName,
        newEmail: user.email, 
      });
      setUser((prev) => ({
        ...prev,
        firstName: newFirstName || prev.firstName,
        lastName: newLastName || prev.lastName,
      }));
      setIsModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };



  return (
    <SafeAreaView className="bg-black-100 h-full justify-center my-auto">
    
    <View className="flex-1 bg-[#161622] p-4">
      <Text className="text-white text-2xl font-semibold mb-4">Account Info</Text>

      <View className="bg-[#232533] p-4 rounded-lg">
        <Text className="text-white mb-2">First Name</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user.firstName}
        </Text>

        <Text className="text-white mb-2">Last Name</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user.lastName}
        </Text>

        <Text className="text-white mb-2">Email</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user.email}
        </Text>

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="p-4 bg-[#4CAF50] rounded-lg mt-4 items-center"
        >
          <Text className="text-white font-semibold">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Editing Profile */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-[#232533] p-6 rounded-lg w-4/5">
            <Text className="text-white text-lg font-semibold mb-4">Edit Profile</Text>

            <FormField 
              title="First Name"
              value={newFirstName|| user.firstName}
              handleChangeText={setNewFirstName}
              placeholder="Enter new first name"
              otherStyles='mt-4'
            />

            <FormField 
              title="Last Name"
              value={newLastName || user.lastName}
              handleChangeText={setNewLastName}
              placeholder="Enter new last name"
              otherStyles='mt-7'
            />

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-gray-500 p-3 rounded-lg w-1/3 items-center"
              >
                <Text className="text-white font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                disabled={isSaving}
                className={`p-3 rounded-lg w-1/3 items-center ${isSaving ? 'bg-gray-500' : 'bg-[#4CAF50]'}`}
              >
                <Text className="text-white font-semibold">{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </SafeAreaView>
  );
};

export default AccountInfo;
