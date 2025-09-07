// Import necessary components and hooks
import { View, ScrollView, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import Greeting from '../../components/ui/Greeting';
import MedicationItem from '../../components/medication/MedicationItem';
import Footer from '../../components/layout/Footer';
import { router } from 'expo-router';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/ui/Loading';
import { icons, images } from '../../constants';
import MedicationItemExpanded from '../../components/medication/MedicationItemExpanded';
import { registerForPushNotificationsAsync } from '../../services/Scheduler';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';


const Home = () => {
  const [expandedTodayIndex, setExpandedTodayIndex] = useState(null);
  const [expandedOtherIndex, setExpandedOtherIndex] = useState(null);
  const [todaysMedications, setTodaysMedications] = useState([]);
  const [otherActiveMedications, setOtherActiveMedications] = useState([]);
  
  // Use new contexts
  const { 
    medications, 
    loadMedications, 
    updateMedication: updateMedicationContext,
    setAdherenceResponseId,
    isLoading,
    hasDemoMedications,
    clearDemoMedications
  } = useApp();
  const { user, isAuthenticated, isGuest } = useAuth();
 

  
  useEffect(()=>{
    if (!isAuthenticated()) {
     router.replace('/signIn');
    }
    
  }, [isAuthenticated])

  useFocusEffect(()=>{
    // Data is already available from AppContext
    // No need to manually set state
  })

  useEffect(() => {
    let subscription;

    (async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission not granted for notifications.');
            return;
        }

        await registerForPushNotificationsAsync();

        subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const { medicationId } = response.notification.request.content.data;

            if (medicationId) {
                console.log('Navigating to:', `/response/${medicationId}`);
                setTimeout(() => {
                // Set adherence response ID using AppContext
                if (setAdherenceResponseId) {
                    setAdherenceResponseId(medicationId);
                }
                router.push(`/report`);
                }, 100);
            }
        });
    })();

    return () => {
        if (subscription) {
            subscription.remove();
        }
    };
}, []);

  useEffect(() => {
    if (user?.id) {
      loadMedications();
    }
  }, [user?.id]);

  useEffect(() => {
    // Get current day of week and time
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
    
    // Filter active medications - handle both database format and demo format
    const activeMedications = medications.filter(med => {
      // Check if medication is active and not expired
      const isActive = med.isActive !== false; // Default to true if not specified
      const endDate = med.end_date || med.endDate;
      const isNotExpired = !endDate || new Date(endDate) >= new Date();
      
      return isActive && isNotExpired;
    });

    console.log('All medications:', medications.length);
    console.log('Active medications:', activeMedications.length);
    activeMedications.forEach(med => {
      console.log('Active med:', med.name || med.medicationSpecification?.name, 'hasReminder:', med.reminder?.enabled);
    });

    // Separate medications with today's reminders vs others
    const todaysReminders = [];
    const otherMedications = [];

    activeMedications.forEach(med => {
      const hasReminderToday = med.reminder?.enabled && 
        med.reminder?.reminderTimes?.some(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const reminderTime = hours * 60 + minutes;
          return reminderTime >= currentTime; // Still upcoming today
        });

      if (hasReminderToday) {
        todaysReminders.push(med);
      } else {
        otherMedications.push(med);
      }
    });

    console.log('Today\'s reminders:', todaysReminders.length);
    console.log('Other medications:', otherMedications.length);

    setTodaysMedications(todaysReminders);
    setOtherActiveMedications(otherMedications);
  }, [medications]);


  const ReminderItem = ({ item, isExpanded, toggleExpand, onToggleReminder, onUpdateReminderTimes }) => {
    return !isExpanded ? (
      <MedicationItem item={item} onPress={toggleExpand} />
    ) : (
      <MedicationItemExpanded
        item={item}
        toggleExpand={toggleExpand}
        onToggleReminder={onToggleReminder}
        onUpdateReminderTimes={onUpdateReminderTimes}
      />
    );
  };

  ReminderItem.propTypes = {
    item: PropTypes.object.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    toggleExpand: PropTypes.func.isRequired,
    onToggleReminder: PropTypes.func.isRequired,
    onUpdateReminderTimes: PropTypes.func.isRequired,
  };


  const handleUpdateReminder = async (medicationId, times, enable, isTodaysSection = true) => {
    try {
      const enabled = times.length > 0 ? enable : false;
      
      // Find the medication in the appropriate array
      const sourceArray = isTodaysSection ? todaysMedications : otherActiveMedications;
      const medicationToUpdate = sourceArray.find(med => med.id === medicationId);
      
      if (!medicationToUpdate) {
        console.log('Medication not found');
        return;
      }
      
      // Prepare medication data for update
      const updateData = {
        ...medicationToUpdate,
        reminder: {
          ...medicationToUpdate.reminder,
          reminderTimes: enabled ? times : [],
          enabled,
        },
      };

      // Update using AppContext
      await updateMedicationContext(medicationToUpdate.id, updateData);
      
      // The useEffect will automatically update the arrays when medications change
      
    } catch (error) {
      console.log('Error updating medication reminder:', error);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView className="bg-primary h-full py-4">
      <View className="flex-1 h-full">
        <View className="flex-row items-center justify-between px-4 py-2 rounded-b-2xl">
          

          <View className="items-center">
            <Image source={images.logo} resizeMode="contain" className="w-[115px] h-[34px]" />
          </View>

          <TouchableOpacity
            onPress={()=>{
              router.push('/settings/AccountInfo')
            }}
          >
            <icons.UserCircle color="#c0ee77" size={36} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <Greeting name={isGuest ? "Guest" : user?.first_name || "User"} />

          {/* Demo Medications Banner */}
          {hasDemoMedications() && (
            <View className="px-4 mt-4 mb-2">
              <View className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30 rounded-xl p-4">
                <View className="flex-row items-start">
                  <View className="bg-blue-500 rounded-full p-2 mr-3">
                    <Text className="text-white text-xs font-bold">?</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-blue-300 font-psemibold text-base mb-1">
                      Welcome to DoseAlert!
                    </Text>
                    <Text className="text-blue-200 text-sm mb-3">
                      We&apos;ve added some sample medications to help you get started. 
                      You can edit, delete, or add reminders to them.
                    </Text>
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        className="bg-blue-500 px-3 py-2 rounded-lg mr-2"
                        onPress={() => {
                          clearDemoMedications();
                        }}
                      >
                        <Text className="text-white text-sm font-psemibold">Clear All Samples</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="bg-transparent border border-blue-400 px-3 py-2 rounded-lg"
                        onPress={() => router.push('/create')}
                      >
                        <Text className="text-blue-300 text-sm font-pmedium">Add My Own</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Quick Stats */}
          {medications.length > 0 && (
            <View className="px-4 mt-2 mb-4">
              <View className="bg-[#232533] rounded-xl p-4">
                <View className="flex-row justify-between items-center">
                  <View className="items-center flex-1">
                    <Text className="text-secondary-200 text-2xl font-pbold">{todaysMedications.length}</Text>
                    <Text className="text-gray-400 text-sm">Today&apos;s Reminders</Text>
                  </View>
                  <View className="w-px h-8 bg-gray-600" />
                  <View className="items-center flex-1">
                    <Text className="text-white text-2xl font-pbold">{medications.filter(med => med.isActive).length}</Text>
                    <Text className="text-gray-400 text-sm">Active Medications</Text>
                  </View>
                  <View className="w-px h-8 bg-gray-600" />
                  <View className="items-center flex-1">
                    <Text className="text-green-400 text-2xl font-pbold">
                      {medications.filter(med => med.reminder?.enabled).length}
                    </Text>
                    <Text className="text-gray-400 text-sm">With Reminders</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Today's Reminders Section */}
          <View className="px-4 mt-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-lg">Today&apos;s Reminders</Text>
              {todaysMedications.length > 0 && (
                <Text className="text-secondary-200 text-sm">{todaysMedications.length} due</Text>
              )}
            </View>
            {todaysMedications.length > 0 ? (
              todaysMedications.map((med, index) => (
                <View key={med.id || index} className="mb-2">
                  <ReminderItem
                    item={med}
                    isExpanded={expandedTodayIndex === index}
                    toggleExpand={() => setExpandedTodayIndex(expandedTodayIndex === index ? null : index)}
                    onToggleReminder={(enabled) => handleUpdateReminder(med.id, med.reminder?.reminderTimes || [], enabled, true)}
                    onUpdateReminderTimes={(times) => handleUpdateReminder(med.id, times, true, true)}
                  />
                </View>
              ))
            ) : (
              <View className="bg-[#232533] rounded-xl p-4 mb-2">
                <Text className="text-gray-500 text-center">No reminders scheduled for today</Text>
                <Text className="text-gray-600 text-center text-sm mt-1">
                  Add reminder times to your medications below
                </Text>
              </View>
            )}
          </View>

          {/* Other Active Medications Section */}
          <View className="px-4 mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-lg">Other Medications</Text>
              {otherActiveMedications.length > 0 && (
                <Text className="text-gray-500 text-sm">{otherActiveMedications.length} active</Text>
              )}
            </View>
            {otherActiveMedications.length > 0 ? (
              otherActiveMedications.map((med, index) => (
                <View key={med.id || index} className="mb-2">
                  <ReminderItem
                    item={med}
                    isExpanded={expandedOtherIndex === index}
                    toggleExpand={() => setExpandedOtherIndex(expandedOtherIndex === index ? null : index)}
                    onToggleReminder={(enabled) => handleUpdateReminder(med.id, med.reminder?.reminderTimes || [], enabled, false)}
                    onUpdateReminderTimes={(times) => handleUpdateReminder(med.id, times, true, false)}
                  />
                </View>
              ))
            ) : todaysMedications.length === 0 ? (
              <View className="bg-[#232533] rounded-xl p-4 mb-2">
                <Text className="text-gray-500 text-center">No active medications found</Text>
                <Text className="text-gray-600 text-center text-sm mt-1">
                  Start by adding your first medication
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Buttons */}
          <View className="px-4 mt-6 space-y-3">
            <TouchableOpacity
              className="bg-secondary-200 p-4 rounded-xl flex-row items-center justify-center shadow-lg active:opacity-80"
              onPress={() => router.push('/create')}
            >
              <Text className="text-primary text-center text-lg font-psemibold">+ Add New Medication</Text>
            </TouchableOpacity>
            
            {medications.length > 0 && (
              <TouchableOpacity
                className="bg-[#232533] border border-gray-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                onPress={() => router.push('/(medication)')}
              >
                <Text className="text-white text-center text-base font-pmedium">View All Medications</Text>
              </TouchableOpacity>
            )}
          </View>
          <Footer />
        </ScrollView>
        
      </View>
    </SafeAreaView>
  );
};

export default Home;