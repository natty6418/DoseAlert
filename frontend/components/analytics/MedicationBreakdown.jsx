import React from 'react';
import { View, Text } from 'react-native';
import MedicationReportItem from '../medication/MedicationReportItem';

const MedicationBreakdown = ({ medications, adherenceReport }) => {
  if (!medications || medications.length === 0) {
    return (
      <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
        <Text className="text-secondary text-xl font-semibold mb-4 text-center">
          💊 Medication Details
        </Text>
        <View className="flex items-center justify-center h-32">
          <Text className="text-gray-400 text-center">No active medications found.</Text>
          <Text className="text-gray-500 text-sm text-center mt-2">
            Add medications to see detailed adherence reports.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
      <Text className="text-secondary text-xl font-semibold mb-4 text-center">
        💊 Medication Details
      </Text>
      
      {medications.map((med, index) => {
        // Find adherence data for this medication from the report
        const medAdherence = adherenceReport?.medication_breakdown?.find(
          (breakdown) => breakdown.medication_id === med.id
        ) || {};
        
        const adherencePercentage = Math.round(medAdherence.adherence_rate || 0);
        const hasMissedStreak = (medAdherence.current_missed_streak || 0) > 0;

        return (
          <View key={index} className="bg-gray-700/30 p-4 mb-4 rounded-lg border border-gray-600/50">
            <MedicationReportItem
              medication={{
                ...med,
                // Ensure compatibility with MedicationReportItem component
                medicationSpecification: {
                  name: med.name || med.medicationSpecification?.name
                }
              }}
              taken={medAdherence.taken || 0}
              missed={medAdherence.missed || 0}
            />
            
            {/* Enhanced Statistics */}
            <View className="mt-4 bg-gray-800/50 p-3 rounded-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300 text-sm">Adherence Rate:</Text>
                <Text className={`text-sm font-semibold ${
                  adherencePercentage >= 90 ? 'text-green-400' : 
                  adherencePercentage >= 80 ? 'text-yellow-400' : 
                  adherencePercentage >= 70 ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {adherencePercentage}%
                </Text>
              </View>
              
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300 text-sm">Current Streak:</Text>
                <Text className="text-secondary text-sm font-semibold">
                  {medAdherence.current_taken_streak || 0} days
                </Text>
              </View>
              
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300 text-sm">Best Streak:</Text>
                <Text className="text-secondary text-sm font-semibold">
                  {medAdherence.longest_taken_streak || 0} days
                </Text>
              </View>
              
              {/* Status Indicator */}
              {hasMissedStreak ? (
                <View className="mt-3 p-2 bg-red-900/30 rounded-lg border border-red-500/30">
                  <Text className="text-red-400 text-sm font-semibold">
                    ⚠️ Current missed streak: {medAdherence.current_missed_streak} days
                  </Text>
                  <Text className="text-red-300 text-xs mt-1">
                    Consider setting additional reminders for this medication
                  </Text>
                </View>
              ) : (
                <View className="mt-3 p-2 bg-green-900/30 rounded-lg border border-green-500/30">
                  <Text className="text-green-400 text-sm font-semibold">
                    ✅ On track with medication
                  </Text>
                  <Text className="text-green-300 text-xs mt-1">
                    Great job maintaining your medication schedule!
                  </Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default MedicationBreakdown;
