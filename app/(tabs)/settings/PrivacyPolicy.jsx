import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { icons } from '../../../constants';

const PrivacyPolicy = () => {
  const [openSections, setOpenSections] = useState({});

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
        'We collect your first name, last name, email address, and any information related to your medication plans entered in the app.',
    },
    {
      title: 'How do we use your information?',
      content:
        'We use your information to provide medication reminders, improve app performance, and send notifications related to your medication plans.',
    },
    {
      title: 'To whom do we disclose your information?',
      content:
        'We do not disclose your information to third parties unless required by law or to protect the rights and safety of others.',
    },
    {
      title: 'What do we do to keep your information secure?',
      content:
        'We use industry-standard security measures to protect your information from unauthorized access, loss, or misuse.',
    },
    {
      title: 'Cookie Policy',
      content:
        'Our app may use cookies or similar technologies to improve functionality and provide personalized experiences.',
    },
  ];

  return (
    <ScrollView className="flex-1 px-4 py-6 bg-black-100">
      <Text className="mb-6 text-4xl text-primary font-pextrabold">Privacy Policy</Text>
      <Text className="mb-6 text-base leading-6 text-primary font-plight">
        At DoseAlert, your privacy is important to us. Here, we explain how we handle your data,
        including what we collect, how we use it, and how we keep it secure.
      </Text>

      {sections.map((section, index) => (
        <View key={index} className="mb-4 rounded-lg bg-black-200">
          <TouchableOpacity
            className="flex-row items-center justify-between px-4 py-3"
            onPress={() => toggleSection(index)}
          >
            <Text className="text-lg text-secondary font-pbold">
              {section.title}
            </Text>
            {openSections[index] ? (
              <icons.ChevronDoubleUp color="#c0ee77" size={20} />
            ) : (
              <icons.ChevronDoubleDown color="#c0ee77" size={20} />
            )}
          </TouchableOpacity>

          {openSections[index] && (
            <View className="px-4 py-2 bg-black-100">
              <Text className="text-sm leading-6 text-primary font-pregular">
                {section.content}
              </Text>
            </View>
          )}
        </View>
      ))}

      <Text className="mt-6 text-sm text-primary font-plight">
        Effective from December 2023
      </Text>
    </ScrollView>
  );
};

export default PrivacyPolicy;
