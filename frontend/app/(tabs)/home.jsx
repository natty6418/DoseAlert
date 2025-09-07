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
  const [expandedReminderIndex, setExpandedReminderIndex] = useState(null);
  const [expandedMedicationIndex, setExpandedMedicationIndex] = useState(null);
  const [upcomingMedicationReminders, setUpcomingMedicationReminders] = useState([]);
  
  // Use new contexts
  const { 
    medications, 
    loadMedications, 
    updateMedication: updateMedicationContext,
    setAdherenceResponseId,
    isLoading
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
    // Filter medications to show only active ones with reminders enabled for upcoming reminders
    const upcomingReminders = medications.filter(med => {
      const isActive = new Date(med.end_date || med.endDate) >= new Date();
      return isActive && med.reminder?.enabled;
    });
    setUpcomingMedicationReminders(upcomingReminders);
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

  const handleUpdateMedication = async (index, medicationData) => {
    try {
      const activeMedications = medications.filter(med => med.isActive);
      const medicationToUpdate = activeMedications[index];
      
      // Update using AppContext
      await updateMedicationContext(medicationToUpdate.id, medicationData);
      
      // Reload medications to get the latest data
      await loadMedications();
      
    } catch (error) {
      console.log('Error updating medication:', error);
    }
  };

  const handleUpdateReminder = async (index, times, enable) => {
    try {
      const enabled = times.length > 0 ? enable : false;
      const medicationToUpdate = upcomingMedicationReminders[index];
      
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
      
      // Update local state
      const updatedMedications = [...upcomingMedicationReminders];
      updatedMedications[index] = updateData;
      setUpcomingMedicationReminders(updatedMedications);
      
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

          <View className="px-4 mt-2">
            <Text className="text-gray-400 text-lg mb-2">Upcoming Reminders</Text>
            {upcomingMedicationReminders.length > 0 ? (
              upcomingMedicationReminders.map((med, index) => (
                <View key={index} className="mb-2">
                  <ReminderItem
                    item={med}
                    isExpanded={expandedReminderIndex === index}
                    toggleExpand={() => setExpandedReminderIndex(expandedReminderIndex === index ? null : index)}
                    onToggleReminder={(enabled) => handleUpdateReminder(index, med.reminder.reminderTimes, enabled)}
                    onUpdateReminderTimes={(times) => handleUpdateReminder(index, times, true)}
                  />
                </View>
              ))
            ) : (
              <Text className="text-gray-500 text-center mt-2">No active reminders found.</Text>
            )}
          </View>

          {/* All Active Medications Section */}
          <View className="px-4 mt-4">
            <Text className="text-gray-400 text-lg mb-2">All Active Medications</Text>
            {medications && medications.filter(med => med.isActive).length > 0 ? (
              medications.filter(med => med.isActive).map((med, index) => (
                <View key={med.id || index} className="mb-2">
                  <ReminderItem
                    item={med}
                    isExpanded={expandedMedicationIndex === index}
                    toggleExpand={() => setExpandedMedicationIndex(expandedMedicationIndex === index ? null : index)}
                    onToggleReminder={(enabled) => {
                      // Handle reminder toggle for all medications
                      const updatedMed = {
                        ...med,
                        reminder: {
                          ...med.reminder,
                          enabled
                        }
                      };
                      handleUpdateMedication(index, updatedMed);
                    }}
                    onUpdateReminderTimes={(times) => {
                      // Handle reminder times update for all medications
                      const updatedMed = {
                        ...med,
                        reminder: {
                          ...med.reminder,
                          times,
                          enabled: times.length > 0
                        }
                      };
                      handleUpdateMedication(index, updatedMed);
                    }}
                  />
                </View>
              ))
            ) : (
              <Text className="text-gray-500 text-center mt-4">No medications found.</Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-gray-900 p-4 rounded-xl mx-4 mt-6 border border-secondary-200 shadow-lg active:opacity-80"
            onPress={() => router.push('/create')}
          >
            <Text className="text-secondary text-center text-xl font-semibold">+ Add More</Text>
          </TouchableOpacity>
          <Footer />
        </ScrollView>
        
      </View>
    </SafeAreaView>
  );
};

export default Home;