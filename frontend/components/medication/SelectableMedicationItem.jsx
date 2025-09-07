import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons } from '../../constants';

const SelectableMedicationItem = ({ 
  item, 
  onPress, 
  isSelectionMode = false, 
  isSelected = false, 
  onSelect,
  onLongPress
}) => {
  const isActive = item.isActive;
  const currentDate = new Date();
  const endDate = item.end_date ? new Date(item.end_date) : null;
  const isExpired = endDate && endDate < currentDate;

  const handlePress = () => {
    if (isSelectionMode && onSelect) {
      onSelect(item.id);
    } else if (onPress) {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress();
    }
  };

  return (
    <TouchableOpacity
      className={`p-4 rounded-2xl shadow-sm border flex-row items-center ${
        isSelected 
          ? 'bg-blue-900 border-blue-700' 
          : isActive && !isExpired 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-900 border-gray-800'
      }`}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && (
        <View className="mr-3">
          {isSelected ? (
            <icons.CheckSquare color="#c0ee77" size={24} />
          ) : (
            <icons.Square color="#6B7280" size={24} />
          )}
        </View>
      )}

      {/* Status Indicator and Pill Icon */}
      <View className="flex-row items-center mr-4">
        <View className={`w-3 h-3 rounded-full mr-3 ${
          isSelected 
            ? 'bg-secondary' 
            : isActive && !isExpired ? 'bg-accent' : 'bg-gray-500'
        }`} />
        <View className={`p-3 rounded-full ${
          isSelected 
            ? 'bg-secondary-200' 
            : isActive && !isExpired ? 'bg-secondary-200' : 'bg-gray-700'
        }`}>
          <Image
            source={icons.pill}
            resizeMode="contain"
            tintColor={isSelected ? "#1E293B" : isActive && !isExpired ? "#FFF" : "#6B7280"}
            className="w-6 h-6"
          />
        </View>
      </View>

      {/* Medication Details */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-lg font-psemibold ${
            isSelected
              ? 'text-white'
              : isActive && !isExpired 
              ? 'text-white' 
              : 'text-gray-400'
          }`}>
            {item.medicationSpecification?.name || 'Unknown Medication'}
          </Text>
          {isExpired && (
            <View className="bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-pmedium">Expired</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-center mb-2">
          <Text className={`text-sm font-pregular ${
            isSelected
              ? 'text-white text-opacity-90'
              : isActive && !isExpired 
              ? 'text-gray-300' 
              : 'text-gray-500'
          }`}>
            {item.dosage?.amount && item.dosage?.unit 
              ? `${item.dosage.amount} ${item.dosage.unit}` 
              : item.dosageAmount && item.dosageUnit
                ? `${item.dosageAmount} ${item.dosageUnit}`
                : 'No dosage specified'}
          </Text>
          <Text className={`text-sm font-pregular mx-2 ${
            isSelected
              ? 'text-white text-opacity-90'
              : isActive && !isExpired 
              ? 'text-gray-300' 
              : 'text-gray-500'
          }`}>
            •
          </Text>
          <Text className={`text-sm font-pregular ${
            isSelected
              ? 'text-white text-opacity-90'
              : isActive && !isExpired 
              ? 'text-gray-300' 
              : 'text-gray-500'
          }`}>
            {item.frequency || 'No frequency set'}
          </Text>
        </View>

        <View className="flex-row items-center">
          <icons.Calendar color={
            isSelected
              ? "#FFF"
              : isActive && !isExpired 
              ? "#9CA3AF" 
              : "#6B7280"
          } size={14} />
          <Text className={`text-xs font-pregular ml-1 ${
            isSelected
              ? 'text-white text-opacity-80'
              : isActive && !isExpired 
              ? 'text-gray-400' 
              : 'text-gray-600'
          }`}>
            {item.start_date ? new Date(item.start_date).toLocaleDateString() : 'No start date'} - {item.end_date ? new Date(item.end_date).toLocaleDateString() : 'Ongoing'}
          </Text>
        </View>
      </View>

      {/* Status Icons */}
      {!isSelectionMode && (
        <View className="items-center ml-3">
          {item.reminder?.enabled && (
            <View className="mb-2">
              <icons.Bell color={isActive && !isExpired ? "#10B981" : "#6B7280"} size={20} />
            </View>
          )}
          <View className={`p-1 rounded-full ${
            isActive && !isExpired ? 'bg-gray-700' : 'bg-gray-800'
          }`}>
            <icons.ChevronUp color={isActive && !isExpired ? "#6366F1" : "#6B7280"} size={16} />
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default SelectableMedicationItem;
