import { View, TextInput, TouchableOpacity } from 'react-native';
import React from 'react'
import { icons } from '../constants';

const SearchBar = ({searchTerm, setSearchTerm}) => {
    return (
        <View className="flex-row items-center px-4 py-2 rounded-b-2xl">
            <View className="flex-row flex-1 items-center bg-gray-800 rounded-full px-4 mx-2 border border-lime-500">
                <TextInput
                    className="flex-1 text-white py-2"
                    placeholder="Search medication plans..."
                    placeholderTextColor="gray"
                    style={{ paddingRight: 8 }} // Ensure there is space for the icon
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    />
                <TouchableOpacity className="ml-2">
                    <icons.MagnifyingGlass color="#A3E635" size={24} /> 
                </TouchableOpacity>
            </View>
        </View>
    );
};


export default SearchBar