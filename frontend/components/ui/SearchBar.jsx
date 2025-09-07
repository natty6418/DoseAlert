import { View, TextInput, TouchableOpacity } from 'react-native';
import React from 'react'
import { icons } from '../../constants';

const SearchBar = ({searchTerm, setSearchTerm, placeholder = "Search medication plans..."}) => {
    return (
        <View className="flex-row items-center">
            <View className="flex-row flex-1 items-center bg-gray-800 rounded-2xl px-4 border border-gray-700">
                <icons.MagnifyingGlass color="#9CA3AF" size={20} /> 
                <TextInput
                    className="flex-1 text-white py-3 ml-3 font-pregular"
                    placeholder={placeholder}
                    placeholderTextColor="#6B7280"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                {searchTerm.length > 0 && (
                    <TouchableOpacity 
                        onPress={() => setSearchTerm('')}
                        className="ml-2 p-1"
                    >
                        <icons.XMark color="#9CA3AF" size={16} /> 
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default SearchBar