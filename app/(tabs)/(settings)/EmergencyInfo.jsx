import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useFirebaseContext } from '../../../contexts/FirebaseContext';
import { db } from '../../../services/firebaseConfig'; // Firebase setup
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';


const EmergencyInfo = () => {
    const { user } = useFirebaseContext();
    const [emergencyInfo, setEmergencyInfo] = useState({
      firstName: '',
      lastName: '',
      email: '',
    });
    const [currentPassword, setCurrentPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
  
    // Validate Email
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
  
    // Fetch Emergency Contact Info
    useEffect(() => {
      const fetchEmergencyInfo = async () => {
        try {
          const userDoc = doc(db, 'users', user.uid); // Assuming "users" collection includes emergency contact info
          const snapshot = await getDoc(userDoc);
          if (snapshot.exists()) {
            const data = snapshot.data();
            setEmergencyInfo({
              firstName: data.emergencyFirstName || '',
              lastName: data.emergencyLastName || '',
              email: data.emergencyEmail || '',
            });
          } else {
            Alert.alert('Error', 'No emergency contact data found.');
          }
        } catch (error) {
          console.error('Error fetching emergency info:', error);
          Alert.alert('Error', 'Failed to load emergency contact information.');
        } finally {
          setLoading(false);
        }
      };
  
      fetchEmergencyInfo();
    }, []);
  
    // Handle Save Changes
    const handleSaveChanges = async () => {
      if (!currentPassword) {
        Alert.alert('Error', 'Please enter your current password to save changes.');
        return;
      }
  
      if (!validateEmail(emergencyInfo.email)) {
        Alert.alert('Error', 'Please enter a valid email address.');
        return;
      }
  
      try {
        setIsSaving(true);
  
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
  
        // Update Firestore
        const userDoc = doc(db, 'users', user.uid);
        await updateDoc(userDoc, {
          emergencyFirstName: emergencyInfo.firstName,
          emergencyLastName: emergencyInfo.lastName,
          emergencyEmail: emergencyInfo.email,
        });
  
        Alert.alert('Success', 'Emergency contact information updated.');
        setCurrentPassword(''); // Clear the password field
      } catch (error) {
        console.error('Error saving changes:', error);
        if (error.code === 'auth/wrong-password') {
          Alert.alert('Error', 'The current password you entered is incorrect.');
        } else {
          Alert.alert('Error', 'Failed to save changes. Please try again.');
        }
      } finally {
        setIsSaving(false);
      }
    };
  
    if (loading) {
      return (
        <View className="items-center justify-center flex-1 bg-black-100">
          <Text className="text-lg text-primary">Loading...</Text>
        </View>
      );
    }
  
    return (
      <View className="flex-1 px-4 py-6 bg-black-100">
        <Text className="mb-6 text-3xl text-primary font-pbold">Emergency Contact</Text>
  
        <View className="p-4 rounded-lg bg-black-200">
          {/* First Name */}
          <Text className="mb-2 text-lg text-primary font-psemibold">First Name</Text>
          <TextInput
            value={emergencyInfo.firstName}
            onChangeText={(text) => setEmergencyInfo({ ...emergencyInfo, firstName: text })}
            className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
          />
  
          {/* Last Name */}
          <Text className="mb-2 text-lg text-primary font-psemibold">Last Name</Text>
          <TextInput
            value={emergencyInfo.lastName}
            onChangeText={(text) => setEmergencyInfo({ ...emergencyInfo, lastName: text })}
            className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
          />
  
          {/* Email */}
          <Text className="mb-2 text-lg text-primary font-psemibold">Email</Text>
          <TextInput
            value={emergencyInfo.email}
            onChangeText={(text) => setEmergencyInfo({ ...emergencyInfo, email: text })}
            className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
            keyboardType="email-address"
            autoCapitalize="none"
          />
  
          {/* Current Password */}
          <Text className="mb-2 text-lg text-primary font-psemibold">Current Password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            className="p-3 mb-4 rounded-lg bg-black-100 text-primary"
            secureTextEntry={true}
          />
  
          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveChanges}
            disabled={isSaving}
            className={`p-4 rounded-lg mt-4 items-center ${
              isSaving ? 'bg-gray-500' : 'bg-secondary'
            }`}
          >
            <Text className="text-black-100 font-psemibold">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  export default EmergencyInfo;