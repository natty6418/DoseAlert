import React from 'react';
import { View, Text } from 'react-native';

const PatternAnalytics = ({ consistencyData, riskPeriodsData }) => {
  const getConsistencyColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConsistencyBgColor = (score) => {
    if (score >= 80) return 'bg-green-900/30';
    if (score >= 60) return 'bg-yellow-900/30';
    return 'bg-red-900/30';
  };

  return (
    <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
      <Text className="text-secondary text-xl font-semibold mb-4 text-center">
        🧠 Pattern Recognition
      </Text>

      {/* Consistency Analysis */}
      {consistencyData && (
        <View className="mb-6">
          <Text className="text-secondary text-lg font-medium mb-2">Adherence Consistency</Text>
          <Text className="text-gray-300 text-sm mb-3">{consistencyData.summary}</Text>
          
          <View className={`p-4 rounded-lg ${getConsistencyBgColor(consistencyData.consistencyScore)}`}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-lg font-semibold">Consistency Score</Text>
              <Text className={`text-2xl font-bold ${getConsistencyColor(consistencyData.consistencyScore)}`}>
                {consistencyData.consistencyScore}/100
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-gray-300 text-sm">Average Daily Rate</Text>
                <Text className="text-white text-lg font-semibold">{consistencyData.averageDailyRate}%</Text>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-300 text-sm">Days Analyzed</Text>
                <Text className="text-white text-lg font-semibold">{consistencyData.daysAnalyzed}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Risk Periods Analysis */}
      {riskPeriodsData && (
        <View>
          <Text className="text-secondary text-lg font-medium mb-2">Risk Periods</Text>
          <Text className="text-gray-300 text-sm mb-3">{riskPeriodsData.summary}</Text>
          
          {riskPeriodsData.riskPeriods && riskPeriodsData.riskPeriods.length > 0 ? (
            <View>
              {riskPeriodsData.riskPeriods.slice(0, 3).map((period, index) => (
                <View key={index} className="bg-red-900/20 p-3 mb-2 rounded-lg border border-red-500/30">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="text-red-300 text-lg font-semibold">{period.timeRange}</Text>
                      <Text className="text-gray-300 text-sm">{period.missedCount} missed doses</Text>
                    </View>
                    <View className="bg-red-500/20 px-3 py-1 rounded-full">
                      <Text className="text-red-400 text-sm font-semibold">{period.percentage}%</Text>
                    </View>
                  </View>
                </View>
              ))}
              
              <View className="mt-3 p-3 bg-blue-900/20 rounded-lg">
                <Text className="text-blue-300 text-sm font-medium">💡 Recommendation</Text>
                <Text className="text-gray-300 text-sm mt-1">
                  Consider setting additional reminders or adjusting medication times for your highest risk periods.
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
              <Text className="text-green-400 text-lg font-semibold">🎉 Excellent!</Text>
              <Text className="text-gray-300 text-sm mt-1">
                No significant risk patterns detected. You&apos;re maintaining consistent adherence!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default PatternAnalytics;
