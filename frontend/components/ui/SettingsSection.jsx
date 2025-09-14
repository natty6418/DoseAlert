import React from 'react';
import { View, Text } from 'react-native';

const SettingsSection = ({ title, children, description = null }) => {
  return (
    <View className="mb-6">
      <Text className="text-white text-lg font-psemibold mb-2">{title}</Text>
      {description && (
        <Text className="text-[#CDCDE0] text-sm mb-4">{description}</Text>
      )}
      {children}
    </View>
  );
};

export default SettingsSection;
