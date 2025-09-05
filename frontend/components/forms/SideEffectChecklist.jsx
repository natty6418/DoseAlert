import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { icons } from '../../constants';

const SideEffectChecklist = ({ sideEffects, setSideEffects, darker=true }) => {
  // Initialize each side effect with unchecked status

  // Toggle the checked status of a side effect
  const toggleChecked = (index) => {
    const updatedItems = [...sideEffects];
    updatedItems[index].checked = !updatedItems[index].checked;
    setSideEffects(updatedItems);
  };

  return (
    <View className={`${darker ? "bg-primary" : "bg-black-200"} rounded-xl p-3`}>
      <Text className="text-gray-300 text-sm font-pregular mb-3">Known Side Effects</Text>
      {sideEffects.length > 0 ? (
        <FlatList
          data={sideEffects}
          scrollEnabled={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => toggleChecked(index)}
              className="flex-row items-center py-2 px-3 mb-2 bg-black-100 rounded-lg border border-gray-600"
            >
              <View className="mr-3">
                {item.checked ? (
                  <icons.CheckCircle color="#10B981" size={20} />
                ) : (
                  <View className="w-5 h-5 border-2 border-gray-500 rounded-full" />
                )}
              </View>
              <Text className={`flex-1 font-pregular ${item.checked ? 'text-white' : 'text-white'}`}>
                {item.term}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <Text className="text-gray-500 text-sm font-pregular italic text-center py-4">
          No side effects listed. Add some below.
        </Text>
      )}
    </View>
  );
};

export default SideEffectChecklist;
