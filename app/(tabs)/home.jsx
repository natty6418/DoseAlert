// Import necessary components and hooks
import { View, ScrollView, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState } from 'react';
import Greeting from '../../components/Greeting';
import MedicationItem from '../../components/MedicationItem';
import Footer from '../../components/Footer';
import { router } from 'expo-router';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { getUser, getMedications } from '../../services/firebaseDatabase';
import LoadingSpinner from '../../components/Loading';
import { icons, images } from '../../constants';
import MedicationItemExpanded from '../../components/MedicationItemExpanded';
import { editMedication } from '../../services/firebaseDatabase';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const context = useFirebaseContext();
  const [upcomingMedicationReminders, setUpcomingMedicationReminders] = useState([]);
  if (!context.isLoggedIn) {
    router.replace('/signIn');
    return null;
  }


  useEffect(() => {
    const fetchMedications = async () => {
      try {
        if (!context.user) return;
        const meds = await getMedications(context.user.id);
        setMedications(meds);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchMedications();
  }, [context.user]);

  useEffect(() => {
    const upcomingReminders = medications.filter(med => med.reminder.enabled);
    // console.log("upcomingReminders", upcomingReminders);
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

  const handleUpdateReminder = (index, times, enabled) => {
    const updatedMedications = [...upcomingMedicationReminders];
    updatedMedications[index] = {
      ...updatedMedications[index],
      reminder: {
        ...updatedMedications[index].reminder,
        reminderTimes: times,
        enabled,
      },
    };
    setUpcomingMedicationReminders(updatedMedications);
   
    editMedication(updatedMedications[index].id, {
      userId: context.user.id,
      dosage: updatedMedications[index].dosage,
      endDate: updatedMedications[index].endDate,
      startDate: updatedMedications[index].startDate,
      frequency: updatedMedications[index].frequency,
      name: updatedMedications[index].medicationSpecification.name,
      directions: updatedMedications[index].medicationSpecification.directions,
      sideEffects: updatedMedications[index].medicationSpecification.sideEffects,
      warning: updatedMedications[index].medicationSpecification.warning,
      purpose: updatedMedications[index].purpose,
      reminderEnabled: enabled,
      reminderTimes: times.map((time) => time.time),
      
    }).then(() => {
      console.log('Medication updated successfully');
    }).catch((error) => {
      console.log('Error updating medication', error);
    }
    );  
  };


  

  if (isLoading || !context.user) return <LoadingSpinner />;

  return (
    <SafeAreaView className="bg-black-100 h-full py-4">
      <View className="flex-1 h-full">
        <View className="flex-row items-center justify-between px-4 py-2 rounded-b-2xl">
          <TouchableOpacity>
            <icons.Bars3 color="#FFFFFF" size={36} />
          </TouchableOpacity>

          <View className="items-center">
            <Image source={images.logo} resizeMode="contain" className="w-[115px] h-[34px]" />
          </View>

          <TouchableOpacity>
            <icons.UserCircle color="#A3E635" size={36} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <Greeting name={context.user?.firstName} />

          <View className="px-4 mt-2">
            <Text className="text-gray-400 text-lg mb-2">Upcoming Reminders</Text>
            {upcomingMedicationReminders.length > 0 ? (
              upcomingMedicationReminders.map((med, index) => (
                <ReminderItem
                  key={index}
                  item={med}
                  isExpanded={expandedIndex === index}
                  toggleExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onToggleReminder={(enabled) => handleUpdateReminder(index, [], enabled)}
                  onUpdateReminderTimes={(times) => handleUpdateReminder(index, times, true)}
                />
              ))
            ) : (
              <Text className="text-gray-500 text-center mt-4">No medications found.</Text>
            )}
          </View>

          <TouchableOpacity
            className="bg-gray-900 p-4 rounded-xl mx-4 mt-2 border border-lime-500 shadow-lg active:opacity-80"
            onPress={() => router.push('/create')}
          >
            <Text className="text-lime-400 text-center text-xl font-semibold">+ Add More</Text>
          </TouchableOpacity>
          <Footer />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Home;
