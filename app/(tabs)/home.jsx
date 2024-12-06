// Import necessary components and hooks
import { View, ScrollView, Image, Text, TouchableOpacity, Button } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useState, useRef } from 'react';
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
import { cancelReminders, Notifications } from '../../services/registerNotification';
import { registerForPushNotificationsAsync } from '../../services/registerNotification';
import { useFocusEffect } from 'expo-router';

const Home = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const context = useFirebaseContext();
  const [upcomingMedicationReminders, setUpcomingMedicationReminders] = useState([]);

  
  useEffect(()=>{
    if (!context.isLoggedIn) {
     router.replace('/signIn');
    }
    
  }, [context.isLoggedIn])

  useFocusEffect(()=>{
    setUser(context.user);
    setMedications(context.medications);
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
            console.log("Notification response received:", response.notification.request.content.data);
            const { medicationId } = response.notification.request.content.data;

            if (medicationId) {
                console.log('Navigating to:', `/response/${medicationId}`);
                setTimeout(() => {
                context.setAdherenceResponseId(medicationId);
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
    const fetchMedications = async () => {
      try {
        if (!context.user) return;
        const meds = (await getMedications(context.user.id)).map((med) =>{
          return {
            ...med,
            isActive: new Date(med.endDate) >= new Date(),
            reminder:{
              ...med.reminder,
              enabled: new Date(med.endDate) >= new Date()?med.reminder.enabled:false,

            }
          }
        });
        
        setUser(context.user);
        setMedications(meds);
        context.setMedications(meds);
        setIsLoading(false);
      } catch (error) {
        console.log(error);
      }
    };
    fetchMedications();
  }, [context.user?.id]);

  useEffect(() => {
    const upcomingReminders = medications.filter(med => med.reminder.enabled);
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

  const handleUpdateReminder = (index, times, enable) => {
    const enabled = times.length > 0 ? enable : false;
    const updatedMedications = [...upcomingMedicationReminders];
    cancelReminders(updatedMedications[index].reminder.reminderTimes.filter(time=>time.id));
    updatedMedications[index] = {
      ...updatedMedications[index],
      reminder: {
        ...updatedMedications[index].reminder,
        reminderTimes: enabled ? times:[],
        enabled,
      },
    };
    setUpcomingMedicationReminders(updatedMedications);
    context.setMedications(updatedMedications);
    editMedication(updatedMedications[index].id, {
      userId: user.id,
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
    })
      .then((data) => {
        updatedMedications[index] = data.data;
        setUpcomingMedicationReminders(updatedMedications);
      })
      .catch((error) => {
        console.log('Error updating medication', error);
      });
  };

  if (isLoading ) return <LoadingSpinner />;

  return (
    <SafeAreaView className="bg-black-100 h-full py-4">
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
            <icons.UserCircle color="#A3E635" size={36} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <Greeting name={user?.firstName} />

          <View className="px-4 mt-2">
            <Text className="text-gray-400 text-lg mb-2">Upcoming Reminders</Text>
            {upcomingMedicationReminders.length > 0 ? (
              upcomingMedicationReminders.map((med, index) => (
                <ReminderItem
                  key={index}
                  item={med}
                  isExpanded={expandedIndex === index}
                  toggleExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onToggleReminder={(enabled) => handleUpdateReminder(index, med.reminder.reminderTimes, enabled)}
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

// <Button title="Logout" onPress={() =>{ 
//           context.setAdherenceResponseId('9DByO0Q9annwYW9ltvSo');
//           router.replace('/report')}
//           } />
//         <Button title="send notification" onPress={async () => {
//           await Notifications.scheduleNotificationAsync({
//             content: {
//               title: 'Medication Reminder',
//               body: 'Take your medication now',
//               data: {medicationId:'9DByO0Q9annwYW9ltvSo'} ,
//             },
//             trigger: {
//               seconds: 5,
//             },
//           });
//         }} />