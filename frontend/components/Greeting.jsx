import React from 'react';
import { View, Text, Image } from 'react-native';
import {images} from '../constants';

export default function Greeting({name}) {
  return (
    <View className="flex-row items-center justify-between bg-gray-900 p-6 rounded-2xl m-4 shadow-lg border border-lime-600">
      <View className="flex flex-col">
        <Text className="text-lime-400 text-3xl font-extrabold mb-1">Hello, {name}!</Text>
        <Text className="text-gray-400 text-lg">Welcome back!</Text> 
      </View>
      <View className="overflow-hidden">
        <Image
          source={images.person}
          className="w-16 h-16"
        />
      </View>
    </View>
  );
}
