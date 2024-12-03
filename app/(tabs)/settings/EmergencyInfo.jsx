import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { useFirebaseContext } from '../../../contexts/FirebaseContext';
import { setEmergencyContact } from '../../../services/firebaseDatabase';
import emailEmergencyContact from '../../../services/emailEmergencyContact';

const EmergencyInfo = () => {
  const { user, setUser } = useFirebaseContext();
  const [emergencyInfo, setEmergencyInfo] = useState(user.emergencyContact || null); // Directly use the emergency contact from user
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: emergencyInfo?.name || '',
    email: emergencyInfo?.email || '',
    relationship: emergencyInfo?.relationship || '',
  });

  // Handle Save Changes
  const handleSaveChanges = async () => {
    if (!form.name || !form.email || !form.relationship) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setIsSaving(true);
    try {
      await setEmergencyContact(user.id, form);
      setEmergencyInfo(form);
      setUser((prev) => ({ ...prev, emergencyContact: form }));
      setIsModalVisible(false);
      Alert.alert('Success', 'Emergency contact updated successfully.');
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('Error', 'Failed to update emergency contact.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Send Email
  const handleSendEmail = async () => {
    if (!emergencyInfo || !emergencyInfo.email) {
      Alert.alert('Error', 'No emergency contact email found.');
      return;
    }

    const message = `Hello ${emergencyInfo.name},\n\nThis is an emergency notification. Please respond promptly.`;

    try {
      await emailEmergencyContact(emergencyInfo.email, emergencyInfo.name, message);
      Alert.alert('Success', 'Email sent successfully.');
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email.');
    }
  };

  return (
    <View className="flex-1 px-4 py-6 bg-black-100">
      <Text className="mb-6 text-3xl text-primary font-pbold">Emergency Contact</Text>

      {/* Emergency Contact Display */}
      {emergencyInfo ? (
        <View className="p-4 rounded-lg bg-black-200">
          <Text className="mb-2 text-lg text-primary font-psemibold">Name</Text>
          <Text className="p-3 mb-4 rounded-lg bg-black-100 text-primary">{emergencyInfo.name}</Text>

          <Text className="mb-2 text-lg text-primary font-psemibold">Email</Text>
          <Text className="p-3 mb-4 rounded-lg bg-black-100 text-primary">{emergencyInfo.email}</Text>

          <Text className="mb-2 text-lg text-primary font-psemibold">Relationship</Text>
          <Text className="p-3 mb-4 rounded-lg bg-black-100 text-primary">{emergencyInfo.relationship}</Text>

          <TouchableOpacity
            onPress={() => {
              setForm(emergencyInfo);
              setIsModalVisible(true);
            }}
            className="p-4 bg-secondary rounded-lg items-center mt-4"
          >
            <Text className="text-black-100 font-psemibold">Edit Contact</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendEmail}
            className="p-4 bg-blue-500 rounded-lg items-center mt-4"
          >
            <Text className="text-white font-psemibold">Send Email</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="p-4 rounded-lg bg-black-200">
          <Text className="text-primary mb-4">No emergency contact found.</Text>
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            className="p-4 bg-secondary rounded-lg items-center"
          >
            <Text className="text-black-100 font-psemibold">Add Emergency Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal for Editing/Adding Emergency Contact */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="p-6 rounded-lg bg-black-200 w-4/5">
            <Text className="text-lg text-primary font-psemibold mb-4">
              {emergencyInfo ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
            </Text>

            <Text className="mb-2 text-primary font-psemibold">Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
            />

            <Text className="mb-2 text-primary font-psemibold">Email</Text>
            <TextInput
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text className="mb-2 text-primary font-psemibold">Relationship</Text>
            <TextInput
              value={form.relationship}
              onChangeText={(text) => setForm({ ...form, relationship: text })}
              className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
            />

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-gray-500 p-3 rounded-lg w-1/3 items-center"
              >
                <Text className="text-white font-psemibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveChanges}
                disabled={isSaving}
                className={`p-3 rounded-lg w-1/3 items-center ${
                  isSaving ? 'bg-gray-500' : 'bg-secondary'
                }`}
              >
                <Text className="text-black-100 font-psemibold">{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default EmergencyInfo;
