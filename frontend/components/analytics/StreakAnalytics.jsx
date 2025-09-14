import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const StreakAnalytics = ({ streakData, frequencyData }) => {
  const chartConfig = {
    color: (opacity = 1) => `rgba(192, 238, 119, ${opacity})`,
    strokeWidth: 2,
  };

  const getStreakScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getStreakScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-900/30';
    if (score >= 60) return 'bg-yellow-900/30';
    if (score >= 30) return 'bg-orange-900/30';
    return 'bg-red-900/30';
  };

  // Prepare frequency chart data
  const frequencyChartData = frequencyData?.streakFrequency ? 
    frequencyData.streakFrequency
      .filter(freq => freq.count > 0)
      .map((freq, index) => ({
        name: freq.name,
        population: freq.count,
        color: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ][index % 4],
        legendFontColor: '#FFFFFF',
        legendFontSize: 12,
      })) : [];

  return (
    <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
      <Text className="text-secondary text-xl font-semibold mb-4 text-center">
        🔥 Streak Analytics
      </Text>

      {/* Overall Streak Performance */}
      {streakData && (
        <View className="mb-6">
          <Text className="text-secondary text-lg font-medium mb-2">Streak Performance</Text>
          <Text className="text-gray-300 text-sm mb-3">{streakData.summary}</Text>
          
          <View className={`p-4 rounded-lg mb-4 ${getStreakScoreBgColor(streakData.overallStreakScore)}`}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-lg font-semibold">Overall Streak Score</Text>
              <Text className={`text-2xl font-bold ${getStreakScoreColor(streakData.overallStreakScore)}`}>
                {streakData.overallStreakScore}/100
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-gray-300 text-sm">Current Average</Text>
                <Text className="text-white text-lg font-semibold">{streakData.averageCurrentStreak} days</Text>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-gray-300 text-sm">Best Average</Text>
                <Text className="text-white text-lg font-semibold">{streakData.averageLongestStreak} days</Text>
              </View>
            </View>
          </View>

          {/* Best Performer */}
          {streakData.bestPerformer && (
            <View className="bg-secondary/10 p-4 rounded-lg border border-secondary/30 mb-4">
              <Text className="text-secondary text-lg font-semibold mb-2">🏆 Top Performer</Text>
              <Text className="text-white text-lg font-medium">{streakData.bestPerformer.medicationName}</Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-300 text-sm">
                  Current: <Text className="text-secondary font-semibold">{streakData.bestPerformer.currentStreak} days</Text>
                </Text>
                <Text className="text-gray-300 text-sm">
                  Best: <Text className="text-secondary font-semibold">{streakData.bestPerformer.longestStreak} days</Text>
                </Text>
              </View>
            </View>
          )}

          {/* Individual Medication Streaks */}
          {streakData.medicationStreaks && streakData.medicationStreaks.length > 0 && (
            <View>
              <Text className="text-secondary text-lg font-medium mb-2">Individual Streaks</Text>
              {streakData.medicationStreaks.map((med, index) => (
                <View key={index} className="bg-gray-700/50 p-3 mb-2 rounded-lg">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-medium">{med.medicationName}</Text>
                      <Text className="text-gray-300 text-sm">
                        Current: {med.currentStreak} days | Best: {med.longestStreak} days
                      </Text>
                    </View>
                    <View className={`w-3 h-3 rounded-full ${med.isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Streak Frequency Analysis */}
      {frequencyData && (
        <View>
          <Text className="text-secondary text-lg font-medium mb-2">Streak Frequency</Text>
          <Text className="text-gray-300 text-sm mb-3">{frequencyData.summary}</Text>
          
          {frequencyChartData.length > 0 ? (
            <View>
              <PieChart
                data={frequencyChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 10]}
                absolute={false}
              />
              
              <View className="mt-4 p-3 bg-blue-900/20 rounded-lg">
                <Text className="text-blue-300 text-sm font-medium">📈 Insights</Text>
                <Text className="text-gray-300 text-sm mt-1">
                  You&apos;ve completed {frequencyData.totalStreaksAnalyzed} streaks with an average length of{' '}
                  {frequencyData.averageStreakLength} days. Keep building those longer streaks!
                </Text>
              </View>
            </View>
          ) : (
            <View className="bg-gray-700/50 p-4 rounded-lg">
              <Text className="text-gray-400 text-center">
                No completed streaks to analyze yet. Start building your first streak!
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default StreakAnalytics;
