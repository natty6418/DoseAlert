import React, { useState, useEffect } from 'react';
import { Modal, View, ScrollView, Text, TextInput, Switch, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PickerComponent from './Picker';
import FormField from './FormField';
import CustomButton from './CustomButton';
import { updateMedication, deleteMedication } from '../services/MedicationHandler';
import { useApp } from '../contexts/AppContext';
import LoadingSpinner from './Loading';
import { icons } from '../constants';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/Scheduler';
import SideEffectChecklist from './SideEffectChecklist';
import ErrorModal from './ErrorModal';

const EditMedicationPlanModal = ({ visible, onClose, onSave, onDeleteMedication, medicationData }) => {
    const [name, setName] = useState(medicationData?.medicationSpecification?.name || '');
    const [dosage, setDosage] = useState(medicationData?.dosage || { amount: '', unit: '' });
    const [startDate, setStartDate] = useState(medicationData?.start_date ? new Date(medicationData.start_date) : null);
    const [endDate, setEndDate] = useState(medicationData?.end_date ? new Date(medicationData.end_date) : null);
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [frequency, setFrequency] = useState(medicationData?.frequency || 'Daily');
    const [directions, setDirections] = useState(medicationData?.medicationSpecification?.directions || '');
    const [purpose, setPurpose] = useState(medicationData?.medicationSpecification?.purpose || '');
    const [sideEffects, setSideEffects] = useState(
        medicationData?.medicationSpecification?.sideEffects || []);
    const [warning, setWarning] = useState(medicationData?.medicationSpecification?.warnings || '');
    const [reminderEnabled, setReminderEnabled] = useState(medicationData?.reminder?.enabled || false);
    const [reminderTimes, setReminderTimes] = useState(medicationData?.reminder?.times || []);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [newSideEffect, setNewSideEffect] = useState('');

    // Use AppContext and AuthContext
    const { user } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        (async () => {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            alert('Permission not granted for notifications.');
          }
        await registerForPushNotificationsAsync();
        })();

      }, []);
      useEffect(()=>{
        if(medicationData){
            setName(medicationData.medicationSpecification.name);
            setDosage(medicationData.dosage);
            setStartDate(medicationData.start_date ? new Date(medicationData.start_date) : null);
            setEndDate(medicationData.end_date ? new Date(medicationData.end_date) : null);
            setFrequency(medicationData.frequency);
            setDirections(medicationData.medicationSpecification.directions);
            setPurpose(medicationData.purpose || '');
            setSideEffects(medicationData.medicationSpecification.sideEffects || []);
            setWarning(medicationData.medicationSpecification.warning || '');
            setReminderEnabled(medicationData.reminder?.enabled || false);
            // Handle both 'times' and 'reminderTimes' properties safely
            const reminderTimesArray = medicationData.reminder?.reminderTimes || medicationData.reminder?.times || [];
            setReminderTimes(reminderTimesArray.map(r => r.time ? r.time : r) || []);
            // console.log("reminderTimes",medicationData.reminder);
        }
      },[medicationData]);

    const resetToDefault = () => {
        setName('');
        setDosage({ amount: '', unit: '' });
        setStartDate(null);
        setEndDate(null);
        setFrequency('Daily');
        setDirections('');
        setPurpose('');
        setSideEffects([]);
        setWarning('');
        setReminderEnabled(false);
        setReminderTimes([]);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        setShowTimePicker(false);
        setError(null);
    };

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

    const handleEditPlan = async () => {
        setIsLoading(true);
        try {
            const response = await updateMedication(medicationData, {
                userId: user?.id,
                dosage,
                startDate,
                endDate,
                frequency,
                name,
                directions,
                sideEffects,
                reminderEnabled,
                reminderTimes,
                purpose,
                warning,                
            });
           
            if(response.error){
                setError(response.error);
                return;
            } else{
                onSave(response.data);
                console.log("saved")
                resetToDefault();
            }
            onClose();
        } catch (error) {
            console.error('Error saving medication plan:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePlan = async () => {
        setIsLoading(true);
        try {
            const response = await deleteMedication(medicationData.id);
            if(response.error){
                setError(response.error);
                return;
            } 
            onDeleteMedication(medicationData.id);
            resetToDefault();
            
            onClose();
        } catch (error) {
            console.error('Error deleting medication plan:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
    // reminderTimes.length > 0 && console.log(new Date(reminderTimes[0].time).toLocaleTimeString());
    if (error) {
        console.log('Error:', error);
        return <ErrorModal message={error} onClose={() => setError(null)} />;
    }

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
                        <Text className="text-2xl font-semibold text-secondary-100 mt-5 font-psemibold">Edit Medication Plan</Text>
                        <TouchableOpacity
                            onPress={handleDeletePlan}
                        >
                            <Text
                                className="text-base text-red-500 font-plight mt-1 underline"
                            >Delete</Text>
                        </TouchableOpacity>
                        {/* Form Fields */}
                        <FormField
                            title="Name"
                            value={name}
                            handleChangeText={(e) => setName(e)}
                            otherStyles="mt-7"
                            keyboardType="default"
                            placeholder="e.g. Aspirin"
                            required={true}
                        />
                        <View className={'flex-1 flex-row w-full justify-between gap-2'}>
                            <FormField
                                title="Dosage"
                                value={dosage.amount}
                                handleChangeText={(e) => setDosage({...dosage, amount: e})}
                                otherStyles="mt-7 flex-1"
                                keyboardType="default"
                                placeholder="Amount (e.g. 200)"
                                required={true}
                            />
                            <FormField
                                title=" "
                                value={dosage.unit}
                                handleChangeText={(e) => setDosage({...dosage, unit: e})}
                                otherStyles="mt-7 flex-1"
                                keyboardType="default"
                                placeholder="Units (e.g. mg)"
                            />
                        </View>
                        <View className={'flex flex-row mt-7'}>
                            <Text className="text-base text-gray-100 font-pmedium">Start Date</Text>
                            <Text className="text-red-500 text-base font-pmedium">*</Text>
                        </View>
                        <TouchableOpacity testID='start-date' onPress={() => setShowStartDatePicker(true)} className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 focus:border-secondary flex flex-row items-center">
                            <Text className="flex-1 text-white font-psemibold text-base">{startDate?.toDateString()}</Text>
                        </TouchableOpacity>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleStartDateChange}
                                minimumDate={new Date()}
                                maximumDate={new Date(new Date().setMonth(new Date().getMonth() + 1))}
                                testID='startDatePicker'
                            />
                        )}
                        <View className={'flex flex-row mt-7'}>
                            <Text className="text-base text-gray-100 font-pmedium">End Date</Text>
                            <Text className="text-red-500 text-base font-pmedium">*</Text>
                        </View>
                        <TouchableOpacity testID='end-date' onPress={() => setShowEndDatePicker(true)} className="w-full h-16 px-4 bg-black-100 rounded-2xl border-2 border-black-200 focus:border-secondary flex flex-row items-center">
                            <Text className="flex-1 text-white font-psemibold text-base">{endDate?.toDateString()}</Text>
                        </TouchableOpacity>
                        {showEndDatePicker && (
                            <DateTimePicker
                                value={endDate || new Date()}
                                mode="date"
                                display="default"
                                onChange={handleEndDateChange}
                                minimumDate={startDate || new Date()}
                                maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
                                testID='endDatePicker'
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
                                testID='enable-reminders-switch'
                            />
                        </View>

                        {/* Reminder Times Section */}
                        {reminderEnabled && (
                            <View className="w-full text-center p-4 border-2 border-black-200 rounded-lg">
                                <Text className="text-base text-white font-pmedium mb-3 mx-auto">Reminder Times</Text>
                                {reminderTimes.length > 0 && (
                                    reminderTimes.map((reminder, index) => (
                                        
                                        <View
                                            key={index}
                                            className="bg-gray-700 py-2 px-4 rounded-lg mb-2 flex-row justify-between items-center"
                                        >
                                            <Text className="text-white font-pmedium">
                                                { reminder.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    // Remove the selected reminder time
                                                    const updatedTimes = reminderTimes.filter((_, i) => i !== index);
                                                    setReminderTimes(updatedTimes);
                                                }}
                                                className="p-2 rounded-full ml-2"
                                            >
                                                <icons.XMark color="#ef4444" size={12} />
                                            </TouchableOpacity>
                                        </View>
                                    ))
                                ) }
                        
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    className="bg-blue-400 p-3 rounded-full flex-row items-center justify-center shadow-md self-center"
                                    testID='add-reminder-button'
                                >
                                    <icons.PlusCircle color="#FFF" size={48} className="w-12 h-12" />
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
                                testID='date-time-picker'
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
                        
                        <SideEffectChecklist sideEffects={sideEffects} setSideEffects={setSideEffects} />
                        <View className='flex flex-row'>
                            <icons.PlusCircle color="#9CA3AF" size={24} />
                            <TextInput
                                value={newSideEffect}
                                onChangeText={(e) => setNewSideEffect(e)}
                                className="ml-2 w-full text-white font-pregular"
                                placeholder='Add item....'
                                placeholderTextColor='#9CA3AF'
                                onSubmitEditing={() => {
                                    setSideEffects([...sideEffects, { term: newSideEffect, checked: true }]);
                                    setNewSideEffect('');
                                }}
                            />

                        </View>

                        {/* Close Button */}
                        <View className="flex flex-1 flex-row w-full justify-between">
                            <CustomButton
                                title="Save Plan"
                                handlePress={()=>{
                                    
                                        handleEditPlan();
                                    
                                }}
                                containerStyles="mt-4 flex-1 mx-2 bg-secondary-200"
                                textStyles="text-lg"
                                isLoading={isLoading}
                            />
                            <CustomButton
                                title="Cancel"
                                handlePress={()=>{
                                    onClose();
                                    // resetToDefault();
                                }}
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

export default EditMedicationPlanModal;
