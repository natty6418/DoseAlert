import React, { useState } from 'react';
import { View, Text,TextInput, FlatList, TouchableOpacity } from 'react-native';
import { icons } from '../constants';

const SideEffectChecklist = ({ sideEffects }) => {
  // Initialize each side effect with unchecked status
  const [checkedItems, setCheckedItems] = useState(
    sideEffects.map(effect => ({ term: effect, checked: false }))
  );
  const [newItem, setNewItem] = useState('');

  // Toggle the checked status of a side effect
  const toggleChecked = (index) => {
    const updatedItems = [...checkedItems];
    updatedItems[index].checked = !updatedItems[index].checked;
    setCheckedItems(updatedItems);
  };

  return (
    <View className="bg-black-100 rounded-lg mt-7">
      <Text className="text-base text-gray-100 font-pmedium mb-2">Side Effects Checklist</Text>
      <FlatList
        data={checkedItems}
        scrollEnabled={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => toggleChecked(index)}
            className="flex-row items-center"
          >
            {item.checked ? <icons.CheckCircle color="#A3E635" size={24} /> : <icons.PlusCircle color="#9CA3AF" size={24} />}
            <Text className="ml-2 text-white font-pregular">{item.term}</Text>
          </TouchableOpacity>
        )}
      />
      <View className='flex flex-row'>
        <icons.PlusCircle color="#9CA3AF" size={24} />
        <TextInput 
        value={newItem}
        onChangeText={(e) => setNewItem(e)}
        className="ml-2 text-white font-pregular" 
        placeholder='Add item....'
        placeholderTextColor='#9CA3AF'
        onSubmitEditing={() => {
                setCheckedItems([...checkedItems, { term: newItem, checked: true }]);
                setNewItem('');
        }}
        />
      
      </View>
    </View>
  );
};

export default SideEffectChecklist;
