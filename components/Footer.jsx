import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function Footer() {
  return (
    <View className="flex-row justify-between px-4 py-2 mt-4">
      <TouchableOpacity>
        <Text className="text-gray-400 underline">Send feedback</Text>
      </TouchableOpacity>
      <TouchableOpacity>
        <Text className="text-gray-400 underline">Privacy Policy</Text>
      </TouchableOpacity>
    </View>
  );
}
