import React from 'react';
import { View, Text, Image } from 'react-native';

import { icons } from '../constants';

export default function MedicationItem({ name, time }) {
  return (
    <View className="flex-row items-center justify-between bg-gray-700 p-4 rounded-lg m-2">
      <View className="flex-row items-center">
      <Image
      source={icons.pill}
      resizeMode="contain"
      tintColor="#CDCDE0"
      className="w-6 h-6"
    />
        <Text className="text-white text-lg ml-2">{name}</Text>
      </View>
      <Text className="text-gray-400">{time}</Text>
    </View>
  );
}
