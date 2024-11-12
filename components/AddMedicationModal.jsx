import React, { useState, useEffect } from 'react';
import { Modal, View, ScrollView, Text, Switch, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PickerComponent from './Picker';
import FormField from './FormField';
import CustomButton from './CustomButton';
import { addNewMedication } from '../services/firebaseDatabase';
import { useFirebaseContext } from '../contexts/FirebaseContext';
import LoadingSpinner from './Loading';
import { icons } from '../constants';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/registerNotification';
import SideEffectChecklist from './SideEffectChecklist';

const AddMedicationPlanModal = ({ visible, onClose, onSave, medicationData }) => {
    const [name, setName] = useState(medicationData?.name || '');
    const [dosage, setDosage] = useState(medicationData?.dosage || '');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [frequency, setFrequency] = useState('Daily');
    const [directions, setDirections] = useState(medicationData?.directions || '');
    const [purpose, setPurpose] = useState(medicationData?.purpose || '');
    const [sideEffects, setSideEffects] = useState(medicationData?.sideEffects || []);
    const [warning, setWarning] = useState(medicationData?.warning || '');
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderTimes, setReminderTimes] = useState([]);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const context = useFirebaseContext();

    useEffect(() => {
        (async () => {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            alert('Permission not granted for notifications.');
          }
        await registerForPushNotificationsAsync();
        })();

      }, []);

    const handleStartDateChange = (event, selectedDate) => {
        setShowStartDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            setStartDate(selectedDate);
        }
    };


    const handleEndDateChange = (event, selectedDate) => {
        setShowEndDatePicker(false);
        if (event.type === 'set' && selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const addReminderTime = (event, selectedDate) => {
        if (event.type === 'set') {
            const newTime = selectedDate || new Date();
            setReminderTimes([...reminderTimes, newTime]);
        }
        setShowTimePicker(false);
    };

    const toggleReminder = () => setReminderEnabled(!reminderEnabled);

    const scheduleReminders = async () => {
        for (const time of reminderTimes) {
            console.log(time);
            const triggerDate = new Date();
            triggerDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
            
            // Schedule notification at the specified time, daily
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Medication Reminder",
                    body: `It's time to take ${name}.`,
                },
                trigger: {
                    hour: triggerDate.getHours(),
                    minute: triggerDate.getMinutes(),
                    repeats: true,
                },
            });
        }
    };

    const handleSavePlan = async () => {
        setIsLoading(true);
        try {
            // Add medication plan to database
            console.log('Saving medication plan...');
            const data = {
                userId: context.user.uid,
                dosage,
                startDate,
                endDate,
                frequency,
                medicationSpecification: {
                    name,
                    directions,
                },
                reminder: {
                    enabled: reminderEnabled,
                    reminderTimes,
                },
            };
            onSave(data);
            await addNewMedication(data);

            // Schedule reminders if enabled
            if (reminderEnabled && reminderTimes.length > 0) {
                console.log('Scheduling reminders...');
                await scheduleReminders();
            }

            onClose();
        } catch (error) {
            console.error('Error saving medication plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black-70">
                <View className="bg-black-100  px-6">
                    <ScrollView className="flex-1">
                        <Text className="text-2xl font-semibold text-secondary-100 mt-5 font-psemibold">Add Medication Plan</Text>

                        {/* Form Fields */}
                        <FormField
                            title="Name"
                            value={name}
                            handleChangeText={(e) => setName(e)}
                            otherStyles="mt-7"
                            keyboardType="default"
                            placeholder="e.g. Aspirin"
                        />
                        <FormField
                            title="Dosage"
                            value={dosage}
                            handleChangeText={(e) => setDosage(e)}
                            otherStyles="mt-7"
                            keyboardType="default"
                            placeholder="e.g. 200 mg"
                        />
                        <Text className="text-base text-gray-100 font-pmedium mt-7">Start Date</Text>
                        <TouchableOpacity onPress={() => setShowStartDatePicker(true)} className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 focus:border-secondary flex flex-row items-center">
                            <Text className="flex-1 text-white font-psemibold text-base">{startDate?.toDateString()}</Text>
                        </TouchableOpacity>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleStartDateChange}
                            />
                        )}
                        <Text className="text-base text-gray-100 font-pmedium mt-7">End Date</Text>
                        <TouchableOpacity onPress={() => setShowEndDatePicker(true)} className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 focus:border-secondary flex flex-row items-center">
                            <Text className="flex-1 text-white font-psemibold text-base">{endDate?.toDateString()}</Text>
                        </TouchableOpacity>
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={endDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleEndDateChange}
                            />
                        )}
                        {/* End Date Picker */}

                        <PickerComponent
                            title="Frequency"
                            value={frequency}
                            handleValueChange={(itemValue) => setFrequency(itemValue)}
                            otherStyles="mt-7"
                            options={{
                                Daily: 'Daily',
                                Weekly: 'Weekly',
                                Monthly: 'Monthly',
                            }}
                            mode="dropdown"
                        />

                        <View className="flex-row items-center mt-2">
                            <Text className="text-base text-gray-100 font-pmedium">Enable Reminders</Text>
                            <Switch
                                value={reminderEnabled}
                                onValueChange={toggleReminder}
                                trackColor={{ false: '#d1d5db', true: '#0099ff' }}
                                thumbColor={reminderEnabled ? '#66c2ff' : '#f3f4f6'}
                            />
                        </View>

                        {/* Reminder Times Section */}
                        {reminderEnabled && (
                            <View className="w-full text-center p-4 border-2 border-black-200 rounded-lg">
                                <Text className="text-base text-white font-pmedium mb-3 mx-auto">Reminder Times</Text>
                                {reminderTimes.length > 0 && (
                                    reminderTimes.map((time, index) => (
                                        <View
                                            key={index}
                                            className="bg-gray-700 py-2 px-4 rounded-lg mb-2 flex-row justify-between items-center"
                                        >
                                            <Text className="text-white font-pmedium">
                                                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    // Remove the selected reminder time
                                                    const updatedTimes = reminderTimes.filter((_, i) => i !== index);
                                                    setReminderTimes(updatedTimes);
                                                }}
                                                className="bg-red-500 p-2 rounded-full ml-2"
                                            >
                                                <icons.XMark color="#A3E635" size={12} />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) }
                        
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    className="bg-blue-400 p-3 rounded-full flex-row items-center justify-center shadow-md"
                                    style={{ alignSelf: 'center' }}
                                >
                                    <icons.PlusCircle color="#FFF" size={48} style={{ width: 48, height: 48 }} />
                                </TouchableOpacity>
                            </View>
                        )}
                        

                        {/* Show DateTimePicker if triggered */}
                        {showTimePicker && (
                            <DateTimePicker
                                mode="time"
                                is24Hour={false}
                                display="default"
                                value={new Date()}
                                onChange={addReminderTime}
                                textColor="#00000"
                                accentColor="#00000"
                            />
                        )}
                        <FormField
                            title="Purpose"
                            value={purpose}
                            handleChangeText={(e) => setPurpose(e)}
                            otherStyles="mt-5"
                            keyboardType="default"
                            placeholder="Enter text"
                            
                        />
                        <FormField
                            title="Directions"
                            value={directions}
                            handleChangeText={(e) => setDirections(e)}
                            otherStyles="mt-7"
                            keyboardType="default"
                            placeholder="Enter text"
                            multiline = {true}
                        />
                        <FormField
                            title="Warning"
                            value={warning}
                            handleChangeText={(e) => setWarning(e)}
                            otherStyles="mt-7"
                            keyboardType="default"
                            placeholder="Enter text"
                            multiline = {true}
                        />
                        {sideEffects.length > 0 && (
                            <SideEffectChecklist sideEffects={sideEffects} />
                        )}

                        {/* Close Button */}
                        <View className="flex flex-1 flex-row w-full justify-between">
                            <CustomButton
                                title="Save Plan"
                                handlePress={handleSavePlan}
                                containerStyles="mt-4 flex-1 mx-2 bg-secondary-200"
                                textStyles="text-lg"
                                isLoading={isLoading}
                            />
                            <CustomButton
                                title="Cancel"
                                handlePress={onClose}
                                containerStyles="mt-4 flex-1 mx-2 bg-red-400"
                                textStyles="text-lg"
                                isLoading={isLoading}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default AddMedicationPlanModal;
