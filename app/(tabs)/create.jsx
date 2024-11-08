import React, { useState } from 'react';
import { Modal, View, ScrollView, Text, Button, Switch, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import PickerComponent from '../../components/Picker';
import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';

const AddMedicationPlanModal  = ({visible, onClose}) => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [period, setPeriod] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmPm] = useState('AM');
  const [directions, setDirections] = useState('');
  const [warning, setWarning] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTimes, setReminderTimes] = useState([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsloading] = useState(false);

  const addReminderTime = (event, selectedDate) => {
    if (event.type === 'set') { 
      const newTime = selectedDate || new Date();
      setReminderTimes([...reminderTimes, newTime]);
    }
    setShowTimePicker(false);
  };

  const toggleReminder = () => setReminderEnabled(!reminderEnabled);

  return (
    <Modal
  visible={visible}
  animationType="slide"
  transparent={true}
  onRequestClose={onClose}
>
  <View className="flex-1 justify-center items-center bg-black-200 bg-opacity-50">
    <View className="bg-black-100 w-11/12 h-5/6 rounded-2xl p-6 shadow-lg">
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
        <FormField
          title="Period"
          value={period}
          handleChangeText={(e) => setPeriod(e)}
          otherStyles="mt-7 focus:border-secondary"
          keyboardType="default"
          placeholder="e.g. 30 days"
        />
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
            trackColor={{ false: '#d1d5db', true: '#4ade80' }}
            thumbColor={reminderEnabled ? '#34d399' : '#f3f4f6'}
          />
        </View>

        {/* Reminder Times Section */}
        {reminderEnabled && (
          <View className="mb-4 w-full text-center p-4 rounded-lg shadow-lg">
            <Text className="text-base text-white font-pmedium mb-3 mx-auto">Reminder Times</Text>
            {reminderTimes.length > 0 ? (
              reminderTimes.map((time, index) => (
                <View
                  key={index}
                  className="bg-gray-700 p-2 rounded-lg mb-2"
                  style={{ alignItems: 'center' }}
                >
                  <Text className="text-white font-pmedium">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 mb-2">No reminders set yet</Text>
            )}
        
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              className="bg-secondary-200 p-3 rounded-full flex-row items-center justify-center shadow-md mt-2"
              style={{ alignSelf: 'center' }}
            >
              <Text className="text-white text-lg font-medium">+ Add Time</Text>
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
          title="Directions"
          value={directions}
          handleChangeText={(e) => setDirections(e)}
          otherStyles=""
          keyboardType="default"
          placeholder="Enter text"
          multiline
        />
        <FormField
          title="Warning"
          value={warning}
          handleChangeText={(e) => setWarning(e)}
          otherStyles="mt-7"
          keyboardType="default"
          placeholder="Enter text"
          multiline
        />
        

        {/* Close Button */}
        <View className="flex flex-1 flex-row w-full justify-between">
          <CustomButton 
            title="Save Plan" 
            handlePress={onClose} 
            containerStyles="mt-4 flex-1 mx-2" 
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

const CreateScreen = () => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <View className="flex-1 justify-center items-center">
      <Button title="Add Medication Plan" onPress={() => setModalVisible(true)} />
      <AddMedicationPlanModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
};

export default CreateScreen;
