import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const CreateScreen = () => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [period, setPeriod] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [hour, setHour] = useState('10');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmPm] = useState('AM');
  const [directions, setDirections] = useState('');
  const [warning, setWarning] = useState('');

  return (
    <ScrollView className="flex-1 p-6 bg-gray-100">
  <Text className="text-2xl font-bold text-blue-800 mb-6">Add Medication Plan</Text>

  <Text className="text-lg font-semibold text-gray-700 mb-2">Name</Text>
  <TextInput
    value={name}
    onChangeText={setName}
    className="border border-gray-300 p-4 rounded-lg mb-4 text-gray-900"
    placeholder="e.g., Aspirin"
  />

  <Text className="text-lg font-semibold text-gray-700 mb-2">Dosage</Text>
  <TextInput
    value={dosage}
    onChangeText={setDosage}
    className="border border-gray-300 p-4 rounded-lg mb-4 text-gray-900"
    placeholder="e.g., 200 mg"
  />

  <Text className="text-lg font-semibold text-gray-700 mb-2">Period</Text>
  <TextInput
    value={period}
    onChangeText={setPeriod}
    className="border border-gray-300 p-4 rounded-lg mb-4 text-gray-900"
    placeholder="e.g., 30 days"
  />

  <Text className="text-lg font-semibold text-gray-700 mb-2">Frequency</Text>
  <View className="border border-gray-300 rounded-lg mb-4">
    <Picker
      selectedValue={frequency}
      onValueChange={(itemValue) => setFrequency(itemValue)}
      className="text-gray-700"
    >
      <Picker.Item label="Daily" value="Daily" />
      <Picker.Item label="Weekly" value="Weekly" />
      <Picker.Item label="Monthly" value="Monthly" />
    </Picker>
  </View>

  <Text className="text-lg font-semibold text-gray-700 mb-2">Reminder Time</Text>
  <View className="flex-row justify-between mb-4">
    <View className="flex-1 border border-gray-300 rounded-lg mr-2">
      <Picker
        selectedValue={hour}
        onValueChange={(itemValue) => setHour(itemValue)}
        className="text-gray-700"
      >
        {[...Array(12).keys()].map((num) => (
          <Picker.Item key={num} label={`${num + 1}`} value={`${num + 1}`} />
        ))}
      </Picker>
    </View>
    
    <View className="flex-1 border border-gray-300 rounded-lg mr-2">
      <Picker
        selectedValue={minute}
        onValueChange={(itemValue) => setMinute(itemValue)}
        className="text-gray-700"
      >
        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num) => (
          <Picker.Item key={num} label={`${num < 10 ? `0${num}` : num}`} value={`${num < 10 ? `0${num}` : num}`} />
        ))}
      </Picker>
    </View>
    
    <View className="flex-1 border border-gray-300 rounded-lg">
      <Picker
        selectedValue={ampm}
        onValueChange={(itemValue) => setAmPm(itemValue)}
        className="text-gray-700"
      >
        <Picker.Item label="AM" value="AM" />
        <Picker.Item label="PM" value="PM" />
      </Picker>
    </View>
  </View>

  <Text className="text-lg font-semibold text-gray-700 mb-2">Directions</Text>
  <TextInput
    value={directions}
    onChangeText={setDirections}
    className="border border-gray-300 p-4 rounded-lg mb-4 text-gray-900"
    placeholder="Enter text here"
    multiline
  />

  <Text className="text-lg font-semibold text-gray-700 mb-2">Warning</Text>
  <TextInput
    value={warning}
    onChangeText={setWarning}
    className="border border-gray-300 p-4 rounded-lg mb-4 text-gray-900"
    placeholder="Enter warning text"
    multiline
  />
</ScrollView>
  );
};

// const styles = StyleSheet.create({
//   container: { flexGrow: 1, padding: 20, backgroundColor: '#F3F3F3' },
//   title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
//   input: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginVertical: 10 },
//   textArea: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginVertical: 10, height: 100 },
//   pickerContainer: { backgroundColor: '#fff', borderRadius: 8, marginVertical: 10 },
//   picker: { height: 50, width: '100%' },
//   timePickerContainer: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     marginVertical: 10,
//   },
//   timePicker: {
//     height: 50,
//     width: '30%', // Set the width to fit the screen
//   },
// });

export default CreateScreen;
