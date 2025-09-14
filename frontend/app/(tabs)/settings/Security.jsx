import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Shield, Lock, Key, Trash2, Eye } from 'lucide-react-native';
import SettingsSection from '../../../components/ui/SettingsSection';
import SettingsCard from '../../../components/ui/SettingsCard';
import { useAuth } from '../../../contexts/AuthContext';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const SecuritySettings = () => {
  const { isGuest } = useAuth();

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

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'You will be redirected to change your password. This will require you to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {/* Navigate to change password */} }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Account', style: 'destructive', onPress: () => {/* Handle account deletion */} }
              ]
            );
          }
        }
      ]
    );
  };

  const handleViewDataExport = () => {
    Alert.alert(
      'Data Export',
      'Export your medication data and account information.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export Data', onPress: () => {/* Handle data export */} }
      ]
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView className="bg-primary h-full">
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="flex-row items-center py-4">
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              className="mr-4"
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-psemibold">Security & Privacy</Text>
          </View>

          <View className="flex-1 justify-center items-center px-6">
            <Shield size={64} color="#9CA3AF" />
            <Text className="text-white text-xl font-psemibold text-center mt-4">
              Account Required
            </Text>
            <Text className="text-[#CDCDE0] text-center mt-2 mb-6">
              Create an account to access security and privacy settings.
            </Text>
            <TouchableOpacity
              className="bg-secondary-200 px-6 py-3 rounded-xl"
              onPress={() => router.push('/(auth)/signIn')}
            >
              <Text className="text-primary font-psemibold">Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 px-4">
        <ScreenHeader 
          title="Security & Privacy"
          showBackButton={true}
        />

        <ScrollView className="flex-1">
          <SettingsSection 
            title="Account Security"
            description="Manage your account security settings"
          >
            <SettingsCard
              title="Change Password"
              description="Update your account password"
              IconComponent={Lock}
              onPress={handleChangePassword}
            />
            <SettingsCard
              title="Two-Factor Authentication"
              description="Add an extra layer of security"
              IconComponent={Key}
              onPress={() => {/* Navigate to 2FA setup */}}
              badge="Soon"
            />
          </SettingsSection>

          <SettingsSection 
            title="Data & Privacy"
            description="Control your personal data and privacy"
          >
            <SettingsCard
              title="Data Export"
              description="Download a copy of your data"
              IconComponent={Eye}
              onPress={handleViewDataExport}
            />
            <SettingsCard
              title="Privacy Settings"
              description="Manage data sharing preferences"
              IconComponent={Shield}
              onPress={() => {/* Navigate to privacy settings */}}
            />
          </SettingsSection>

          <SettingsSection 
            title="Account Management"
            description="Manage your account settings"
          >
            <SettingsCard
              title="Delete Account"
              description="Permanently delete your account and data"
              IconComponent={Trash2}
              onPress={handleDeleteAccount}
              highlight={false}
            />
          </SettingsSection>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SecuritySettings;
