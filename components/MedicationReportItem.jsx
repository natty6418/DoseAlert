import React from 'react';
import { View, Text } from 'react-native';

const MedicationReportItem = ({ medication, taken, missed }) => {
  // 1. Implement logic to calculate takenCount and missedCount
  //    (This will depend on how you store tracking information)
  //const takenCount = calculateTakenCount(medication); // Replace with your logic
  //const missedCount = calculateMissedCount(medication); // Replace with your logic

  ///* dummy values

  //*/

  return (
    <View className="bg-gray-900 p-4 rounded-lg mb-3">
      <Text className="text-white text-lg font-psemibold">
        {medication.medicationSpecification.name}
      </Text>
      <View className="flex-row justify-between mt-2">
        <Text className="text-green-500">Taken: {taken}</Text>
        <Text className="text-red-500">Missed: {missed}</Text>
      </View>
    </View>
  );
};

export default MedicationReportItem;