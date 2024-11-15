import React, { useState } from 'react';
import { View, Text,TextInput, FlatList, TouchableOpacity } from 'react-native';
import { icons } from '../constants';

const SideEffectChecklist = ({ sideEffects, setSideEffects, darker=true }) => {
  // Initialize each side effect with unchecked status
  const [newItem, setNewItem] = useState('');

  // Toggle the checked status of a side effect
  const toggleChecked = (index) => {
    const updatedItems = [...sideEffects];
    updatedItems[index].checked = !updatedItems[index].checked;
    setSideEffects(updatedItems);
  };

  return (
    <View className={`${darker ? "bg-black-100" : "bg-black-200"} rounded-lg mt-7`}>
      <Text className="text-base text-gray-100 font-pmedium mb-2">Side Effects Checklist</Text>
      {sideEffects.length > 0 && <FlatList
        data={sideEffects}
        scrollEnabled={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => toggleChecked(index)}
            className="flex-row items-center"
          >
            {item.checked ? <View testID='checked'><icons.CheckCircle color="#A3E635" size={24} /></View> : <View testID='not-checked'><icons.PlusCircle color="#9CA3AF" size={24} /></View> }
            <Text className="ml-2 text-white font-pregular">{item.term}</Text>
          </TouchableOpacity>
        )}
      />}
      <View className='flex flex-row'>
        <icons.PlusCircle color="#9CA3AF" size={24} />
        <TextInput 
        value={newItem}
        onChangeText={(e) => setNewItem(e)}
        className="ml-2 w-full text-white font-pregular" 
        placeholder='Add item....'
        placeholderTextColor='#9CA3AF'
        onSubmitEditing={() => {
                setSideEffects([...sideEffects, { term: newItem, checked: true }]);
                setNewItem('');
        }}
        />
      
      </View>
    </View>
  );
};

export default SideEffectChecklist;
