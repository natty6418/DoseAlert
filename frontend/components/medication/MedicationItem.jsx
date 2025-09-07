import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { icons } from '../../constants';

const MedicationItem = ({ item, onPress }) => {
  const isActive = item.isActive;
  const isDemoMedication = item.isDemoMedication;
  const currentDate = new Date();
  const endDate = item.end_date || item.endDate ? new Date(item.end_date || item.endDate) : null;
  const isExpired = endDate && endDate < currentDate;

  // Handle both demo medication format and regular medication format
  const medicationName = item.name || item.medicationSpecification?.name || 'Unknown Medication';
  const dosageText = item.dosage && item.dosageUnit 
    ? `${item.dosage} ${item.dosageUnit}`
    : (item.dosage?.amount && item.dosage?.unit 
        ? `${item.dosage.amount} ${item.dosage.unit}` 
        : item.dosageAmount && item.dosageUnit
          ? `${item.dosageAmount} ${item.dosageUnit}`
          : 'No dosage specified');
  const frequencyText = item.frequency || 'No frequency set';
  const startDate = item.start_date || item.startDate;
  const endDateForDisplay = item.end_date || item.endDate;

  return (
    <TouchableOpacity
      className={`p-4 rounded-2xl shadow-sm border flex-row items-center ${
        isActive && !isExpired 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-900 border-gray-800'
      }`}
      onPress={onPress}
    >
      {/* Status Indicator and Pill Icon */}
      <View className="flex-row items-center mr-4">
        <View className={`w-3 h-3 rounded-full mr-3 ${
          isActive && !isExpired ? 'bg-accent' : 'bg-gray-500'
        }`} />
        <View className={`p-3 rounded-full ${
          isActive && !isExpired ? 'bg-secondary-200' : 'bg-gray-700'
        }`}>
          <Image
            source={icons.pill}
            resizeMode="contain"
            tintColor={isActive && !isExpired ? "#FFF" : "#6B7280"}
            className="w-6 h-6"
          />
        </View>
      </View>

      {/* Medication Details */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <View className="flex-row items-center flex-1">
            <Text className={`text-lg font-psemibold ${
              isActive && !isExpired ? 'text-white' : 'text-gray-400'
            }`}>
              {medicationName}
            </Text>
            {isDemoMedication && (
              <View className="bg-blue-500 px-2 py-1 rounded-full ml-2">
                <Text className="text-white text-xs font-pmedium">Sample</Text>
              </View>
            )}
          </View>
          {isExpired && (
            <View className="bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-pmedium">Expired</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-center mb-2">
          <Text className={`text-sm font-pregular ${
            isActive && !isExpired ? 'text-gray-300' : 'text-gray-500'
          }`}>
            {dosageText}
          </Text>
          <Text className={`text-sm font-pregular mx-2 ${
            isActive && !isExpired ? 'text-gray-300' : 'text-gray-500'
          }`}>
            •
          </Text>
          <Text className={`text-sm font-pregular ${
            isActive && !isExpired ? 'text-gray-300' : 'text-gray-500'
          }`}>
            {frequencyText}
          </Text>
        </View>

        <View className="flex-row items-center">
          <icons.Calendar color={isActive && !isExpired ? "#9CA3AF" : "#6B7280"} size={14} />
          <Text className={`text-xs font-pregular ml-1 ${
            isActive && !isExpired ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {startDate ? new Date(startDate).toLocaleDateString() : 'No start date'} - {endDateForDisplay ? new Date(endDateForDisplay).toLocaleDateString() : 'Ongoing'}
          </Text>
        </View>
      </View>

      {/* Status Icons */}
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
    </TouchableOpacity>
  );
};

export default MedicationItem;