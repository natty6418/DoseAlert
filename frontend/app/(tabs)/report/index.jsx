import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../../contexts/AppContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getAdherenceSummary,
  getStreakAnalytics,
  getAdherenceByTimeOfDay,
  getAdherenceByDayOfWeek,
  getAverageTimeToTake,
  getAdherenceConsistency,
  getRiskPeriods
} from '../../../services/AdherenceTracker';
import LoadingSpinner from '../../../components/ui/Loading';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { 
  TrendingUp, 
  Target, 
  Award, 
  BarChart3, 
  Clock, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react-native';

// Simplified metric card component
const MetricCard = ({ icon: Icon, title, value, subtitle, color = "text-secondary", onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    className={`bg-gray-800 border-gray-700 border rounded-2xl p-6 mb-4 ${onPress ? 'active:bg-gray-700' : ''}`}
    disabled={!onPress}
  >
    <View className="flex-row items-center mb-3">
      <Icon size={24} color="#c0ee77" />
      <Text className="text-white font-pmedium text-lg ml-3">{title}</Text>
    </View>
    <Text className={`${color} font-pbold text-3xl mb-1`}>{value}</Text>
    {subtitle && (
      <Text className="text-gray-300 font-pregular text-sm">{subtitle}</Text>
    )}
  </TouchableOpacity>
);

// Large summary card
const SummaryCard = ({ adherenceSummary }) => {
  const adherenceRate = adherenceSummary?.adherenceRate || 0;
  const takenDoses = adherenceSummary?.takenDoses || 0;
  const totalDoses = adherenceSummary?.totalDoses || 0;
  
  const getAdherenceColor = (rate) => {
    if (rate >= 90) return "text-green-400";
    if (rate >= 80) return "text-secondary";
    if (rate >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getAdherenceMessage = (rate) => {
    if (rate >= 90) return "Excellent! Keep it up! 🌟";
    if (rate >= 80) return "Good progress! 👍";
    if (rate >= 70) return "Room for improvement 📈";
    return "Let's get back on track 💪";
  };

  return (
    <View className="bg-gray-800 border-gray-700 border rounded-3xl p-8 mb-6">
      <View className="items-center">
        <View className="bg-primary rounded-full p-6 mb-4">
          <Target size={40} color="#c0ee77" />
        </View>
        <Text className={`${getAdherenceColor(adherenceRate)} font-pbold text-5xl mb-2`}>
          {Math.round(adherenceRate)}%
        </Text>
        <Text className="text-white font-psemibold text-xl mb-2">
          Adherence Rate
        </Text>
        <Text className="text-secondary font-pmedium text-center mb-4">
          {getAdherenceMessage(adherenceRate)}
        </Text>
        <View className="flex-row justify-center">
          <View className="items-center mr-8">
            <Text className="text-white font-pbold text-2xl">{takenDoses}</Text>
            <Text className="text-gray-300 font-pregular">Taken</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-pbold text-2xl">{totalDoses}</Text>
            <Text className="text-gray-300 font-pregular">Total</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Quick stats grid
const QuickStats = ({ streakData, timeData, dayData, timingData, consistencyData, riskData }) => {
  const currentStreak = streakData?.averageCurrentStreak || 0;
  const bestTime = timeData?.bestTime?.name || "Morning";
  const bestDay = dayData?.bestDay?.name || "Monday";
  const avgMinutesLate = timingData?.averageMinutesLate || 0;
  const consistencyScore = consistencyData?.consistencyScore || 0;
  const riskPeriods = riskData?.riskPeriods?.length || 0;

  return (
    <View>
      <Text className="text-white font-pbold text-xl mb-6">Detailed Analytics</Text>
      
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <MetricCard
            icon={Award}
            title="Current Streak"
            value={`${currentStreak}`}
            subtitle={currentStreak === 1 ? "day" : "days"}
            color={currentStreak > 7 ? "text-green-400" : "text-secondary"}
          />
        </View>
        <View className="flex-1 ml-2">
          <MetricCard
            icon={Activity}
            title="Consistency"
            value={`${consistencyScore}%`}
            subtitle="Daily consistency"
            color={consistencyScore >= 80 ? "text-green-400" : consistencyScore >= 60 ? "text-secondary" : "text-yellow-400"}
          />
        </View>
      </View>

      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <MetricCard
            icon={Clock}
            title="Best Time"
            value={bestTime}
            subtitle="Highest adherence"
          />
        </View>
        <View className="flex-1 ml-2">
          <MetricCard
            icon={Calendar}
            title="Best Day"
            value={bestDay}
            subtitle="Most consistent"
          />
        </View>
      </View>

      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <MetricCard
            icon={TrendingUp}
            title="Avg Delay"
            value={`${avgMinutesLate}m`}
            subtitle="Minutes late"
            color={avgMinutesLate <= 15 ? "text-green-400" : avgMinutesLate <= 60 ? "text-yellow-400" : "text-red-400"}
          />
        </View>
        <View className="flex-1 ml-2">
          <MetricCard
            icon={AlertTriangle}
            title="Risk Periods"
            value={riskPeriods}
            subtitle="Times to watch"
            color={riskPeriods === 0 ? "text-green-400" : "text-yellow-400"}
          />
        </View>
      </View>
    </View>
  );
};

const Report = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [adherenceSummary, setAdherenceSummary] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [timeOfDayData, setTimeOfDayData] = useState(null);
  const [dayOfWeekData, setDayOfWeekData] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const [consistencyData, setConsistencyData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  
  const { medications } = useApp();
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch comprehensive analytics
        const [
          summaryResult,
          streakResult,
          timeResult,
          dayResult,
          timingResult,
          consistencyResult,
          riskResult
        ] = await Promise.allSettled([
          getAdherenceSummary(user.id, 30),
          getStreakAnalytics(user.id),
          getAdherenceByTimeOfDay(user.id, 30),
          getAdherenceByDayOfWeek(user.id),
          getAverageTimeToTake(user.id),
          getAdherenceConsistency(user.id, 30),
          getRiskPeriods(user.id)
        ]);
        
        // Set data from successful requests
        if (summaryResult.status === 'fulfilled') setAdherenceSummary(summaryResult.value);
        if (streakResult.status === 'fulfilled') setStreakData(streakResult.value);
        if (timeResult.status === 'fulfilled') setTimeOfDayData(timeResult.value);
        if (dayResult.status === 'fulfilled') setDayOfWeekData(dayResult.value);
        if (timingResult.status === 'fulfilled') setTimingData(timingResult.value);
        if (consistencyResult.status === 'fulfilled') setConsistencyData(consistencyResult.value);
        if (riskResult.status === 'fulfilled') setRiskData(riskResult.value);
        
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <SafeAreaView className="bg-primary flex-1">
        <ScreenHeader 
          title="Analytics" 
          subtitle="Track your medication progress" 
        />
        <View className="flex-1 justify-center items-center px-6">
          <BarChart3 size={64} color="#c0ee77" />
          <Text className="text-white text-xl font-pbold text-center mt-6 mb-4">
            Sign in to view analytics
          </Text>
          <Text className="text-gray-300 text-center font-pregular">
            Track your medication adherence and progress over time.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasData = adherenceSummary && adherenceSummary.totalDoses > 0;

  return (
    <View className="bg-primary flex-1">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F23" />
      <View className="flex-1 px-4" style={{ paddingTop: insets.top }}>
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <ScreenHeader 
            title="Analytics" 
            subtitle="Track your medication adherence progress"
          />
          
          {isGuest && (
            <View className="bg-gray-800 border-gray-700 border rounded-lg p-3 mb-4">
              <Text className="text-secondary text-center font-pregular text-sm">
                👤 Guest Mode - Data stored locally on this device
              </Text>
            </View>
          )}

          <View className="pb-6">
          {!hasData ? (
            /* Empty State */
            <View className="flex-1 justify-center items-center py-16">
              <Target size={64} color="#6b7280" />
              <Text className="text-white font-psemibold text-xl mt-6 mb-3 text-center">
                No Data Yet
              </Text>
              <Text className="text-gray-300 font-pregular text-center px-8">
                Start taking your medications to see analytics and track your progress here.
              </Text>
            </View>
          ) : (
            <>
              {/* Main Summary */}
              <SummaryCard adherenceSummary={adherenceSummary} />
              
              {/* Detailed Analytics */}
              <QuickStats 
                streakData={streakData}
                timeData={timeOfDayData}
                dayData={dayOfWeekData}
                timingData={timingData}
                consistencyData={consistencyData}
                riskData={riskData}
              />
            </>
          )}

          {/* Medications Overview */}
          {medications.length > 0 && (
            <View className="mt-4">
              <Text className="text-white font-pbold text-xl mb-4">Medications</Text>
              <View className="bg-gray-800 border-gray-700 border rounded-2xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <CheckCircle size={20} color="#c0ee77" />
                    <Text className="text-white font-pmedium ml-2">Active</Text>
                  </View>
                  <Text className="text-secondary font-pbold text-lg">
                    {medications.filter(med => med.isActive !== false).length}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <BarChart3 size={20} color="#6b7280" />
                    <Text className="text-white font-pmedium ml-2">Total</Text>
                  </View>
                  <Text className="text-gray-300 font-pbold text-lg">
                    {medications.length}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Report;
