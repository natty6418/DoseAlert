import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, BackHandler, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, User, X } from 'lucide-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import FormField from '../../../components/forms/FormField';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const AccountInfo = () => {
  const { user, isGuest } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newFirstName, setNewFirstName] = useState(user?.first_name || user?.firstName || '');
  const [newLastName, setNewLastName] = useState(user?.last_name || user?.lastName || '');

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

  useEffect(() => {
    const handleBackPress = () => {
      router.push('/settings');
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  const handleSaveChanges = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call - replace with actual updateUserProfile call
      // await updateUserProfile({ firstName: newFirstName, lastName: newLastName });
      
      Alert.alert('Success', 'Your account information has been updated.');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update your information. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render anything if user is guest (redirect handles this)
  if (isGuest || !user) {
    return null;
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 px-4">
        <ScreenHeader 
          title="Account Information"
          showBackButton={true}
        />

        <ScrollView className="flex-1">
          {/* Profile Header */}
          <View className="bg-[#232533] rounded-xl p-6 mb-6">
            <View className="flex-row items-center">
              <View className="w-20 h-20 bg-secondary-200 rounded-full items-center justify-center mr-4">
                <Text className="text-primary text-2xl font-pbold">
                  {((user?.first_name || user?.firstName)?.charAt(0) || '') + 
                   ((user?.last_name || user?.lastName)?.charAt(0) || '')}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-2xl font-psemibold">
                  {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
                </Text>
                <Text className="text-[#CDCDE0] text-base mt-1">{user?.email}</Text>
                <Text className="text-green-400 text-sm mt-2">✓ Account Verified</Text>
              </View>
            </View>
          </View>

          {/* Account Details */}
          <View className="bg-[#232533] rounded-xl p-6 mb-6">
            <Text className="text-white text-lg font-psemibold mb-4">Personal Information</Text>
            
            <View className="space-y-4">
              <View>
                <Text className="text-[#CDCDE0] text-sm mb-2">First Name</Text>
                <View className="bg-[#1A1A2E] rounded-lg p-4">
                  <Text className="text-white text-base">{user?.first_name || user?.firstName}</Text>
                </View>
              </View>

              <View>
                <Text className="text-[#CDCDE0] text-sm mb-2">Last Name</Text>
                <View className="bg-[#1A1A2E] rounded-lg p-4">
                  <Text className="text-white text-base">{user?.last_name || user?.lastName}</Text>
                </View>
              </View>

              <View>
                <Text className="text-[#CDCDE0] text-sm mb-2">Email Address</Text>
                <View className="bg-[#1A1A2E] rounded-lg p-4">
                  <Text className="text-white text-base">{user?.email}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className="bg-secondary-200 rounded-xl p-4 flex-row items-center justify-center"
              onPress={() => setIsModalVisible(true)}
            >
              <User size={20} color="#0F0F23" className="mr-2" />
              <Text className="text-primary font-psemibold text-base">Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-[#232533] border border-[#9CA3AF] rounded-xl p-4 flex-row items-center justify-center"
              onPress={() => {
                Alert.alert('Change Password', 'Password change functionality will be available soon.');
              }}
            >
              <Text className="text-[#9CA3AF] font-pmedium text-base">Change Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-[#232533] rounded-t-3xl p-6 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-psemibold">Edit Profile</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="space-y-4 mb-6">
              <FormField
                title="First Name"
                value={newFirstName}
                placeholder="Enter your first name"
                handleChangeText={setNewFirstName}
              />
              <FormField
                title="Last Name"
                value={newLastName}
                placeholder="Enter your last name"
                handleChangeText={setNewLastName}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#1A1A2E] rounded-xl p-4 items-center"
                onPress={() => setIsModalVisible(false)}
              >
                <Text className="text-[#9CA3AF] font-pmedium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-secondary-200 rounded-xl p-4 items-center"
                onPress={handleSaveChanges}
                disabled={isSaving}
              >
                <Text className="text-primary font-psemibold">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountInfo;
