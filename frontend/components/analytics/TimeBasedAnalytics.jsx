import React from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get("window").width;

const TimeBasedAnalytics = ({ timeOfDayData, dayOfWeekData, timingData }) => {
  const chartConfig = {
    backgroundGradientFrom: '#1f2937',
    backgroundGradientTo: '#1f2937',
    color: (opacity = 1) => `rgba(192, 238, 119, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  // Prepare time of day chart data
  const timeOfDayChartData = timeOfDayData?.timeSlots ? {
    labels: timeOfDayData.timeSlots.map(slot => slot.timeSlot.charAt(0).toUpperCase() + slot.timeSlot.slice(1)),
    datasets: [{
      data: timeOfDayData.timeSlots.map(slot => slot.adherenceRate)
    }]
  } : null;

  // Prepare day of week chart data
  const dayOfWeekChartData = dayOfWeekData?.dayStats ? {
    labels: dayOfWeekData.dayStats.map(day => day.name.substring(0, 3)),
    datasets: [{
      data: dayOfWeekData.dayStats.map(day => day.adherenceRate)
    }]
  } : null;

  return (
    <View className="bg-gray-800 p-4 mb-6 rounded-lg border border-secondary-200 shadow-lg">
      <Text className="text-secondary text-xl font-semibold mb-4 text-center">
        📊 Time-Based Analytics
      </Text>

      {/* Time of Day Analysis */}
      {timeOfDayData && (
        <View className="mb-6">
          <Text className="text-secondary text-lg font-medium mb-2">Best Times for Taking Medication</Text>
          <Text className="text-gray-300 text-sm mb-3">{timeOfDayData.summary}</Text>
          
          {timeOfDayChartData && (
            <BarChart
              data={timeOfDayChartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              showValuesOnTopOfBars={true}
              fromZero={true}
              className="my-2 rounded-lg"
            />
          )}

          <View className="flex-row justify-between mt-3">
            <View className="flex-1 mr-2 bg-green-900/30 p-3 rounded-lg">
              <Text className="text-green-400 text-sm font-medium">Best Time</Text>
              <Text className="text-white text-lg font-semibold">{timeOfDayData.bestTime?.name}</Text>
              <Text className="text-green-300 text-sm">{timeOfDayData.bestTime?.adherenceRate}% adherence</Text>
            </View>
            <View className="flex-1 ml-2 bg-red-900/30 p-3 rounded-lg">
              <Text className="text-red-400 text-sm font-medium">Needs Improvement</Text>
              <Text className="text-white text-lg font-semibold">{timeOfDayData.worstTime?.name}</Text>
              <Text className="text-red-300 text-sm">{timeOfDayData.worstTime?.adherenceRate}% adherence</Text>
            </View>
          </View>
        </View>
      )}

      {/* Day of Week Analysis */}
      {dayOfWeekData && (
        <View className="mb-6">
          <Text className="text-secondary text-lg font-medium mb-2">Weekly Patterns</Text>
          <Text className="text-gray-300 text-sm mb-3">{dayOfWeekData.summary}</Text>
          
          {dayOfWeekChartData && (
            <BarChart
              data={dayOfWeekChartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              showValuesOnTopOfBars={true}
              fromZero={true}
              className="my-2 rounded-lg"
            />
          )}
        </View>
      )}

      {/* Timing Analysis */}
      {timingData && (
        <View>
          <Text className="text-secondary text-lg font-medium mb-2">Timing Performance</Text>
          <Text className="text-gray-300 text-sm mb-3">{timingData.summary}</Text>
          
          <View className="flex-row justify-between">
            <View className="flex-1 mr-2 bg-blue-900/30 p-3 rounded-lg">
              <Text className="text-blue-400 text-sm font-medium">Average Delay</Text>
              <Text className="text-white text-lg font-semibold">{timingData.averageMinutesLate} min</Text>
            </View>
            <View className="flex-1 ml-2 bg-secondary/20 p-3 rounded-lg">
              <Text className="text-secondary text-sm font-medium">On-Time Rate</Text>
              <Text className="text-white text-lg font-semibold">{timingData.onTimePercentage}%</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default TimeBasedAnalytics;
