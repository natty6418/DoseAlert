import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { icons } from '../constants';

const SideEffectChecklist = ({ sideEffects }) => {
  // Initialize each side effect with unchecked status
  const [checkedItems, setCheckedItems] = useState(
    sideEffects.map(effect => ({ term: effect, checked: false }))
  );

  // Toggle the checked status of a side effect
  const toggleChecked = (index) => {
    const updatedItems = [...checkedItems];
    updatedItems[index].checked = !updatedItems[index].checked;
    setCheckedItems(updatedItems);
  };

  return (
    <View className="bg-white rounded-lg shadow-lg p-4">
      <Text className="text-lg font-semibold text-gray-900 mb-2">Side Effects Checklist</Text>
      <FlatList
        data={checkedItems}
        scrollEnabled={false}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => toggleChecked(index)}
            className="flex-row items-center mb-2"
          >
            {item.checked ? <icons.CheckCircle color="#A3E635" size={24} /> : <icons.PlusCircle color="#9CA3AF" size={24} />}
            <Text className="ml-2 text-gray-800 text-sm">{item.term}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default SideEffectChecklist;
