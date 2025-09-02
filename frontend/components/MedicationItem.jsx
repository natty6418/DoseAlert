import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons } from '../constants';


const MedicationItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      className="p-4 bg-gray-800 mt-2 rounded-lg shadow-lg border border-lime-500 flex-row items-center"
      onPress={onPress}
    >
      {/* Pill Icon */}
      <Image
          source={icons.pill}
          resizeMode="contain"
          tintColor="#91D62A" // Lime color for the icon
          className="w-8 h-8 mr-2"
        />

      {/* Medication Name and Dates */}
      <View className="flex-1">
        <Text className="text-lime-400 text-xl font-semibold">{item.medicationSpecification.name}</Text>
        <View className="flex flex-row">
          <Text className="text-gray-300 text-sm">
            {item.start_date ? new Date(item.start_date).toLocaleDateString() : ''} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : ''}
          </Text>
        </View>
      </View>

      {/* Alarm Icon if Reminder is Enabled */}
      {item.reminder?.enabled && (
        <icons.Clock color="#91D62A" size={24} />
      )}
    </TouchableOpacity>
  );
};

export default MedicationItem;