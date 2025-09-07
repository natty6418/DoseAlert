import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';

const PrivacyPolicy = () => {
  const [openSections, setOpenSections] = useState({});

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

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const sections = [
    {
      title: 'What information do we collect about you?',
      content:
        'We collect your first name, last name, email address, and any information related to your medication plans entered in the app. This includes medication names, dosages, schedules, and adherence tracking data.',
    },
    {
      title: 'How do we use your information?',
      content:
        'We use your information to provide medication reminders, improve app performance, and send notifications related to your medication plans. We also use aggregated, anonymized data to improve our services and develop new features.',
    },
    {
      title: 'To whom do we disclose your information?',
      content:
        'We do not sell, trade, or otherwise transfer your personal information to third parties. We may disclose your information only when required by law or to protect the rights and safety of others.',
    },
    {
      title: 'What do we do to keep your information secure?',
      content:
        'We use industry-standard security measures including encryption, secure servers, and regular security audits to protect your information from unauthorized access, loss, or misuse.',
    },
    {
      title: 'How long do we retain your information?',
      content:
        'We retain your personal information for as long as your account is active or as needed to provide you services. You may request deletion of your account and data at any time through the app settings.',
    },
    {
      title: 'Your rights and choices',
      content:
        'You have the right to access, update, or delete your personal information. You can also opt out of certain communications and control your notification preferences through the app settings.',
    },
    {
      title: 'Changes to this Privacy Policy',
      content:
        'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last Updated" date.',
    },
  ];

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
          <Text className="text-white text-xl font-psemibold">Privacy Policy</Text>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header Section */}
          <View className="bg-[#232533] rounded-xl p-6 mb-6">
            <Text className="text-white text-2xl font-pbold mb-2">Your Privacy Matters</Text>
            <Text className="text-[#CDCDE0] text-base leading-6">
              At DoseAlert, we are committed to protecting your privacy and ensuring the security of your personal health information. This policy explains how we collect, use, and protect your data.
            </Text>
            <Text className="text-[#9CA3AF] text-sm mt-4">Last Updated: December 2024</Text>
          </View>

          {/* Privacy Sections */}
          <View className="space-y-3">
            {sections.map((section, index) => (
              <View key={index} className="bg-[#232533] rounded-xl overflow-hidden">
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4"
                  onPress={() => toggleSection(index)}
                >
                  <Text className="text-white font-pmedium text-base flex-1 pr-4">
                    {section.title}
                  </Text>
                  {openSections[index] ? (
                    <ChevronUp size={20} color="#9CA3AF" />
                  ) : (
                    <ChevronDown size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
                
                {openSections[index] && (
                  <View className="px-4 pb-4 border-t border-[#1E1B3A]">
                    <Text className="text-[#CDCDE0] text-sm leading-6 pt-4">
                      {section.content}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Contact Section */}
          <View className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-6 mt-6 mb-8">
            <Text className="text-blue-300 font-psemibold text-lg mb-2">
              Questions about Privacy?
            </Text>
            <Text className="text-blue-200 text-sm mb-4">
              If you have any questions about this Privacy Policy or how we handle your data, please contact us.
            </Text>
            <TouchableOpacity
              className="bg-blue-500 px-4 py-2 rounded-lg self-start"
              onPress={() => {
                // Navigate to contact or open email
                router.push('/settings/Help');
              }}
            >
              <Text className="text-white font-psemibold">Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
