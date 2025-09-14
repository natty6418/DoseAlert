import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, BackHandler, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, FileText } from 'lucide-react-native';
import SettingsSection from '../../../components/ui/SettingsSection';
import SettingsCard from '../../../components/ui/SettingsCard';
import ScreenHeader from '../../../components/ui/ScreenHeader';

const HelpSupport = () => {
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

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@dosealert.com?subject=DoseAlert Support Request');
  };

  const handlePhoneSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleFAQ = () => {
    // Navigate to FAQ or open external link
    Linking.openURL('https://dosealert.com/faq');
  };

  const handleUserGuide = () => {
    // Navigate to user guide or open external link
    Linking.openURL('https://dosealert.com/guide');
  };

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 px-4">
        <ScreenHeader 
          title="Help & Support"
          showBackButton={true}
        />

        <ScrollView className="flex-1">
          <SettingsSection 
            title="Get Help"
            description="Find answers and get support for DoseAlert"
          >
            <SettingsCard
              title="Frequently Asked Questions"
              description="Find quick answers to common questions"
              IconComponent={HelpCircle}
              onPress={handleFAQ}
            />
            <SettingsCard
              title="User Guide"
              description="Learn how to use DoseAlert effectively"
              IconComponent={FileText}
              onPress={handleUserGuide}
            />
          </SettingsSection>

          <SettingsSection 
            title="Contact Support"
            description="Reach out to our support team"
          >
            <SettingsCard
              title="Email Support"
              description="support@dosealert.com"
              IconComponent={Mail}
              onPress={handleContactSupport}
            />
            <SettingsCard
              title="Phone Support"
              description="Mon-Fri, 9AM-5PM EST"
              IconComponent={Phone}
              onPress={handlePhoneSupport}
            />
            <SettingsCard
              title="Live Chat"
              description="Chat with our support team"
              IconComponent={MessageCircle}
              onPress={() => {/* Open live chat */}}
              badge="Soon"
            />
          </SettingsSection>

          <SettingsSection 
            title="Community"
            description="Connect with other DoseAlert users"
          >
            <SettingsCard
              title="Community Forum"
              description="Share tips and get advice from other users"
              IconComponent={MessageCircle}
              onPress={() => Linking.openURL('https://community.dosealert.com')}
            />
          </SettingsSection>

          {/* App Info */}
          <View className="bg-[#232533] rounded-xl p-4 mt-6">
            <Text className="text-white font-psemibold text-center mb-2">DoseAlert</Text>
            <Text className="text-[#CDCDE0] text-sm text-center">Version 1.0.0</Text>
            <Text className="text-[#CDCDE0] text-xs text-center mt-1">
              Your medication management companion
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default HelpSupport;
