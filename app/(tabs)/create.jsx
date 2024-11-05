import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import CustomButton from "../../components/CustomButton";

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
  const [isTyping, setIsTyping] = useState(false);

  const handleFocus = () => setIsTyping(true);
  const handleBlur = () => setIsTyping(false);

  // reset to default values
  const resetForm = () => {
    setName('');
    setDosage('');
    setPeriod('');
    setFrequency('Daily');
    setHour('10');
    setMinute('00');
    setAmPm('AM');
    setDirections('');
    setWarning('');
  };

  const handleAddMedication = () => {
    // do something
    
    resetForm();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add Medication Plan</Text>

      <Text>Name</Text>
      <TextInput 
        value={name} 
        onChangeText={setName} 
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.input} 
        placeholder="e.g., Aspirin" 
      />

      <Text>Dosage</Text>
      <TextInput 
        value={dosage} 
        onChangeText={setDosage} 
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.input} 
        placeholder="e.g., 200 mg" 
      />

      <Text>Period</Text>
      <TextInput 
        value={period} 
        onChangeText={setPeriod} 
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.input} 
        placeholder="e.g., 30 days" 
      />

      <Text>Frequency</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={frequency}
          onValueChange={(itemValue) => setFrequency(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Daily" value="Daily" />
          <Picker.Item label="Weekly" value="Weekly" />
          <Picker.Item label="Monthly" value="Monthly" />
        </Picker>
      </View>

      <Text>Reminder Time</Text>
      <View style={styles.timePickerContainer}>
        <Picker
          selectedValue={hour}
          onValueChange={(itemValue) => setHour(itemValue)}
          style={styles.timePicker}
        >
          {[...Array(12).keys()].map((num) => (
            <Picker.Item key={num} label={`${num + 1}`} value={`${num + 1}`} />
          ))}
        </Picker>

        <Picker
          selectedValue={minute}
          onValueChange={(itemValue) => setMinute(itemValue)}
          style={styles.timePicker}
        >
          {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((num) => (
            <Picker.Item key={num} label={`${num < 10 ? `0${num}` : num}`} value={`${num < 10 ? `0${num}` : num}`} />
          ))}
        </Picker>

        <Picker
          selectedValue={ampm}
          onValueChange={(itemValue) => setAmPm(itemValue)}
          style={styles.timePicker}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>
      
      <Text>Directions</Text>
      <TextInput
        value={directions}
        onChangeText={setDirections}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.textArea}
        placeholder="Enter text here"
        multiline
      />

      <Text>Warning</Text>
      <TextInput
        value={warning}
        onChangeText={setWarning}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={styles.textArea}
        placeholder="Enter warning text"
        multiline
      />

      {!isTyping && (
        <CustomButton
          title="Add Medication"
          handlePress={handleAddMedication}
          containerStyles="mt-7"
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: '#F3F3F3' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginVertical: 10 },
  textArea: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginVertical: 10, height: 100 },
  pickerContainer: { backgroundColor: '#fff', borderRadius: 8, marginVertical: 10 },
  picker: { height: 50, width: '100%' },
  timePickerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginVertical: 10,
  },
  timePicker: {
    height: 50,
    width: '30%',
  },
});

export default CreateScreen;
