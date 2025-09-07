import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Code, ExternalLink } from 'lucide-react-native';
import SettingsSection from '../../../components/ui/SettingsSection';
import SettingsCard from '../../../components/ui/SettingsCard';

const AboutScreen = () => {
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
          <Text className="text-white text-xl font-psemibold">About DoseAlert</Text>
        </View>

        <ScrollView className="flex-1">
          {/* App Info Card */}
          <View className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-6 mb-6">
            <View className="items-center">
              <View className="w-20 h-20 bg-secondary-200 rounded-full items-center justify-center mb-4">
                <Text className="text-primary text-3xl font-pbold">DA</Text>
              </View>
              <Text className="text-white text-2xl font-pbold">DoseAlert</Text>
              <Text className="text-green-300 text-lg">Version 1.0.0</Text>
              <Text className="text-[#CDCDE0] text-center mt-2">
                Your trusted medication management companion
              </Text>
            </View>
          </View>

          <SettingsSection 
            title="Our Mission"
            description="Empowering you to take control of your health"
          >
            <View className="bg-[#232533] rounded-xl p-4">
              <Text className="text-white text-base leading-6">
                DoseAlert is designed to help you stay on track with your medication schedule. 
                We believe that consistent medication adherence is crucial for your health and wellbeing. 
                Our app provides intelligent reminders, tracking, and insights to support your health journey.
              </Text>
            </View>
          </SettingsSection>

          <SettingsSection 
            title="Features"
            description="What makes DoseAlert special"
          >
            <View className="space-y-3">
              <View className="flex-row items-start bg-[#232533] rounded-lg p-3">
                <View className="w-2 h-2 bg-secondary-200 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-white font-pmedium">Smart Reminders</Text>
                  <Text className="text-[#CDCDE0] text-sm">Intelligent notifications that adapt to your schedule</Text>
                </View>
              </View>
              <View className="flex-row items-start bg-[#232533] rounded-lg p-3">
                <View className="w-2 h-2 bg-secondary-200 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-white font-pmedium">Adherence Tracking</Text>
                  <Text className="text-[#CDCDE0] text-sm">Monitor your medication taking patterns and progress</Text>
                </View>
              </View>
              <View className="flex-row items-start bg-[#232533] rounded-lg p-3">
                <View className="w-2 h-2 bg-secondary-200 rounded-full mt-2 mr-3" />
                <View className="flex-1">
                  <Text className="text-white font-pmedium">Secure Data</Text>
                  <Text className="text-[#CDCDE0] text-sm">Your health information is protected with enterprise-grade security</Text>
                </View>
              </View>
            </View>
          </SettingsSection>

          <SettingsSection 
            title="Legal & Resources"
            description="Important information and links"
          >
            <SettingsCard
              title="Terms of Service"
              description="Read our terms and conditions"
              IconComponent={ExternalLink}
              onPress={() => Linking.openURL('https://dosealert.com/terms')}
            />
            <SettingsCard
              title="Privacy Policy"
              description="Learn how we protect your data"
              IconComponent={ExternalLink}
              onPress={() => router.push('/settings/PrivacyPolicy')}
            />
            <SettingsCard
              title="Open Source Licenses"
              description="View third-party software licenses"
              IconComponent={Code}
              onPress={() => Linking.openURL('https://dosealert.com/licenses')}
            />
          </SettingsSection>

          <SettingsSection 
            title="Connect With Us"
            description="Stay updated and share feedback"
          >
            <SettingsCard
              title="Website"
              description="Visit our official website"
              IconComponent={ExternalLink}
              onPress={() => Linking.openURL('https://dosealert.com')}
            />
            <SettingsCard
              title="Rate DoseAlert"
              description="Help us improve by rating the app"
              IconComponent={Heart}
              onPress={() => {/* Open app store rating */}}
            />
          </SettingsSection>

          {/* Footer */}
          <View className="mt-6 mb-4">
            <Text className="text-[#CDCDE0] text-center text-sm">
              Made with ❤️ for your health
            </Text>
            <Text className="text-[#CDCDE0] text-center text-xs mt-1">
              © 2024 DoseAlert. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default AboutScreen;
