import React from 'react';
import { View, Text } from 'react-native';

const MedicationReportItem = ({ medication }) => {
  // 1. Implement logic to calculate takenCount and missedCount
  //    (This will depend on how you store tracking information)
  //const takenCount = calculateTakenCount(medication); // Replace with your logic
  //const missedCount = calculateMissedCount(medication); // Replace with your logic

  ///* dummy values
  const takenCount = 7; 
  const missedCount = 2;
  //*/

  return (
    <View className="bg-gray-900 p-4 rounded-lg mb-3">
      <Text className="text-white text-lg font-psemibold">
        {medication.medicationSpecification.name}
      </Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-green-500">Taken: {takenCount}</Text>
        <Text className="text-red-500">Missed: {missedCount}</Text>
      </View>
    </View>
  );
};

export default MedicationReportItem;