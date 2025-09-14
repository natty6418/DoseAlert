import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

const OverallSummary = ({ adherenceSummary }) => {
  const chartConfig = {
    backgroundGradientFrom: '#1f2937',
    backgroundGradientTo: '#1f2937',
    color: (opacity = 1) => `rgba(50, 205, 50, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const adherencePercentage = adherenceSummary ? (adherenceSummary.adherenceRate / 100) : 0;
  const adherenceDisplayPercentage = Math.round(adherencePercentage * 100);

  const getAdherenceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 80) return 'text-yellow-400';
    if (percentage >= 70) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAdherenceMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent adherence! Keep up the great work! 🌟';
    if (percentage >= 80) return 'Good adherence. Small improvements can make a big difference! 👍';
    if (percentage >= 70) return 'Fair adherence. Consider setting more reminders. 📅';
    return 'Adherence needs attention. Let&apos;s work on building better habits! 💪';
  };

  if (!adherenceSummary) {
    return (
      <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
        <Text className="text-secondary text-xl font-semibold mb-4 text-center">
          📊 Overall Adherence
        </Text>
        <View className="flex items-center justify-center h-40">
          <Text className="text-gray-400 text-center text-lg mb-2">No adherence data available yet.</Text>
          <Text className="text-gray-500 text-sm text-center">
            Start taking your medications and logging adherence to see your progress!
          </Text>
          <Text className="text-blue-300 text-xs text-center mt-3">
            💡 Tip: Use the medication reminders to track when you take your doses
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
      <Text className="text-secondary text-xl font-semibold mb-4 text-center">
        📊 Overall Adherence
      </Text>
      
      <View className="flex items-center relative mb-4">
        <ProgressChart
          data={{ data: [adherencePercentage] }}
          width={screenWidth - 64}
          height={200}
          strokeWidth={16}
          radius={80}
          chartConfig={chartConfig}
          hideLegend={true}
        />
        <Text className={`text-2xl font-semibold absolute top-[42%] ${getAdherenceColor(adherenceDisplayPercentage)}`}>
          {adherenceDisplayPercentage}%
        </Text>
      </View>

      <Text className="text-gray-300 text-center text-sm mb-4">
        {getAdherenceMessage(adherenceDisplayPercentage)}
      </Text>

      {/* Detailed Breakdown */}
      <View className="bg-gray-700/50 p-4 rounded-lg">
        <Text className="text-secondary text-lg font-medium mb-3 text-center">Breakdown</Text>
        
        <View className="flex-row justify-between mb-2">
          <View className="flex-row justify-between flex-1 mr-2">
            <Text className="text-gray-300 text-sm">Taken:</Text>
            <Text className="text-green-400 text-sm font-semibold">{adherenceSummary.takenDoses}</Text>
          </View>
          <View className="flex-row justify-between flex-1 ml-2">
            <Text className="text-gray-300 text-sm">Missed:</Text>
            <Text className="text-red-400 text-sm font-semibold">{adherenceSummary.missedDoses}</Text>
          </View>
        </View>
        
        <View className="flex-row justify-between mb-2">
          <View className="flex-row justify-between flex-1 mr-2">
            <Text className="text-gray-300 text-sm">Skipped:</Text>
            <Text className="text-yellow-400 text-sm font-semibold">{adherenceSummary.skippedDoses}</Text>
          </View>
          <View className="flex-row justify-between flex-1 ml-2">
            <Text className="text-gray-300 text-sm">Pending:</Text>
            <Text className="text-blue-400 text-sm font-semibold">{adherenceSummary.pendingDoses}</Text>
          </View>
        </View>
        
        <View className="border-t border-gray-600 pt-2 mt-2">
          <View className="flex-row justify-between">
            <Text className="text-gray-300 text-sm font-medium">Total Doses:</Text>
            <Text className="text-secondary text-sm font-semibold">{adherenceSummary.totalDoses}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default OverallSummary;
