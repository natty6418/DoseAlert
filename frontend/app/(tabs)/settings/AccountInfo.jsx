import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, BackHandler } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import FormField from '../../../components/FormField';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
// import { updateUserProfile } from '../../../services/UserHandler';


const AccountInfo = () => {
  const { user, isGuest } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFirstName, setNewFirstName] = useState(user?.first_name || user?.firstName || '');
  const [newLastName, setNewLastName] = useState(user?.last_name || user?.lastName || '');
  // const [newEmail, setNewEmail] = useState(user?.email || '');

  // Redirect guest users to login
  useEffect(() => {
    if (isGuest || !user) {
      Alert.alert(
        'Account Required',
        'You need to create an account or sign in to view account information.',
        [
          {
            text: 'Go to Sign In',
            onPress: () => router.replace('/(auth)/signIn')
          },
          {
            text: 'Go Back',
            onPress: () => router.back()
          }
        ]
      );
      return;
    }
  }, [isGuest, user]);

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
      // Mock profile update - in a real app this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render anything if user is guest or no user data
  if (isGuest || !user) {
    return (
      <SafeAreaView className="bg-black-100 h-full justify-center items-center">
        <Text className="text-white text-lg">Loading...</Text>
      </SafeAreaView>
    );
  }



  return (
    <SafeAreaView className="bg-black-100 h-full justify-center my-auto">
    
    <View className="flex-1 bg-[#161622] p-4">
      <Text className="text-white text-2xl font-semibold mb-4">Account Info</Text>

      <View className="bg-[#232533] p-4 rounded-lg">
        <Text className="text-white mb-2">First Name</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user?.firstName || user?.first_name || 'Not provided'}
        </Text>

        <Text className="text-white mb-2">Last Name</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user?.lastName || user?.last_name || 'Not provided'}
        </Text>

        <Text className="text-white mb-2">Email</Text>
        <Text className="bg-[#1f1f2b] text-white p-3 rounded-lg mb-4">
          {user?.email || 'Not provided'}
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
              value={newFirstName || user?.firstName || user?.first_name || ''}
              handleChangeText={setNewFirstName}
              placeholder="Enter new first name"
              otherStyles='mt-4'
            />

            <FormField 
              title="Last Name"
              value={newLastName || user?.lastName || user?.last_name || ''}
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
