import React from 'react';
import { View, Text, Image } from 'react-native';
import {images} from '../../constants';

export default function Greeting({name}) {
  const isGuest = name === "Guest";
  
  return (
    <View className="flex-row items-center justify-between p-6 rounded-2xl m-4 shadow-lg border bg-gray-800 border-gray-700">
      <View className="flex flex-col">
        <Text className="text-white text-3xl font-extrabold mb-1">
          {isGuest ? "Welcome, Guest!" : `Hello, ${name}!`}
        </Text>
        <Text className="text-gray-400 text-lg">
          {isGuest ? "Explore DoseAlert features!" : "Welcome back!"}
        </Text> 
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
