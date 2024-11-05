import React from 'react';
import { View, Text, Image } from 'react-native';

export default function Greeting() {
  return (
    <View className="flex-row items-center justify-between bg-gray-800 p-4 rounded-lg m-4">
      <Text className="text-white text-2xl font-bold">Hello, User!</Text>
      <Image
        source={{ uri: 'https://path/to/user/icon' }}
        className="w-16 h-16 rounded-full"
      />
    </View>
  );
}
