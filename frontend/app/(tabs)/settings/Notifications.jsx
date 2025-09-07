import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Clock, Smartphone, Volume2 } from 'lucide-react-native';
import SettingsSection from '../../../components/ui/SettingsSection';
import SettingsCard from '../../../components/ui/SettingsCard';

const NotificationSettings = () => {
  const [medicationReminders, setMedicationReminders] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    const handleBackPress = () => {
      router.push('/settings');
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  const SwitchComponent = ({ value, onValueChange }) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#767577', true: '#c0ee77' }}
      thumbColor={value ? '#0F0F23' : '#f4f3f4'}
    />
  );

  return (
    <SafeAreaView className="bg-primary h-full">
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            className="mr-4"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-psemibold">Notifications</Text>
        </View>

        <ScrollView className="flex-1">
          <SettingsSection 
            title="Medication Reminders"
            description="Control when and how you receive medication reminders"
          >
            <SettingsCard
              title="Medication Reminders"
              description="Get notified when it's time to take your medication"
              IconComponent={Bell}
              rightElement={
                <SwitchComponent
                  value={medicationReminders}
                  onValueChange={setMedicationReminders}
                />
              }
            />
            <SettingsCard
              title="Reminder Timing"
              description="15 minutes before scheduled time"
              IconComponent={Clock}
              onPress={() => {/* Navigate to timing settings */}}
              disabled={!medicationReminders}
            />
          </SettingsSection>

          <SettingsSection 
            title="App Notifications"
            description="Control general app notifications and updates"
          >
            <SettingsCard
              title="Daily Reports"
              description="Receive daily adherence summaries"
              IconComponent={Bell}
              rightElement={
                <SwitchComponent
                  value={dailyReports}
                  onValueChange={setDailyReports}
                />
              }
            />
            <SettingsCard
              title="System Notifications"
              description="App updates and important announcements"
              IconComponent={Smartphone}
              rightElement={
                <SwitchComponent
                  value={systemNotifications}
                  onValueChange={setSystemNotifications}
                />
              }
            />
          </SettingsSection>

          <SettingsSection 
            title="Notification Style"
            description="Customize how notifications appear and sound"
          >
            <SettingsCard
              title="Sound"
              description="Play notification sounds"
              IconComponent={Volume2}
              rightElement={
                <SwitchComponent
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                />
              }
            />
            <SettingsCard
              title="Vibration"
              description="Vibrate on notification"
              IconComponent={Smartphone}
              rightElement={
                <SwitchComponent
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                />
              }
            />
          </SettingsSection>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default NotificationSettings;
