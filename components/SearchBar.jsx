import { View, TextInput, TouchableOpacity } from 'react-native';
import React from 'react'
import { icons } from '../constants';

const SearchBar = () => {
    return (
        <View className="flex-row items-center justify-between px-4 py-2 shadow-lg rounded-b-2xl">
            <TouchableOpacity>
                <icons.Bars3 color="#FFFFF" size={24} /> 
            </TouchableOpacity>

            <View className="flex-row flex-1 items-center bg-gray-800 rounded-full px-4 mx-2 border border-lime-500">
                <TextInput
                    className="flex-1 text-white py-2"
                    placeholder="Search"
                    placeholderTextColor="gray"
                    style={{ paddingRight: 8 }} // Ensure there is space for the icon
                />
                <TouchableOpacity className="ml-2">
                    <icons.MagnifyingGlass color="#A3E635" size={24} /> 
                </TouchableOpacity>
            </View>

            <TouchableOpacity>
                <icons.UserCircle color="#A3E635" size={36} />
            </TouchableOpacity>
        </View>
    );
};


export default SearchBar