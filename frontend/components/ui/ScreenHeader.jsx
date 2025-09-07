import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

const ScreenHeader = ({ title, subtitle, showBackButton = false, rightAction = null, centered = false }) => {
  if (centered) {
    return (
      <View className="px-4 pt-6 pb-4 bg-primary">
        <View className="items-center">
          <Text className="text-white text-2xl font-pbold">{title}</Text>
          {subtitle && (
            <Text className="text-gray-400 text-sm font-pregular mt-1 text-center">{subtitle}</Text>
          )}
        </View>
      </View>
    )
  }
  return (
    <View className="px-4 pt-6 pb-4 bg-primary">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {showBackButton && (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <View>
            <Text className="text-white text-2xl font-pbold">{title}</Text>
            {subtitle && (
              <Text className="text-gray-400 text-sm font-pregular mt-1">{subtitle}</Text>
            )}
          </View>
        </View>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} className={rightAction.containerStyles}>
            {rightAction.icon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default ScreenHeader;
