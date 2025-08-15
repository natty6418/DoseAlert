import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Footer() {
  return (
    <View className="flex-row justify-between px-4 py-2 mt-4">
      <TouchableOpacity>
        <Text className="text-gray-400 underline">Send feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          router.replace('/settings/PrivacyPolicy');
        }}
      >
        <Text className="text-gray-400 underline">Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}
