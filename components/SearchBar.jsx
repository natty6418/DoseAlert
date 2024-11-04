import { View, TextInput, TouchableOpacity } from 'react-native';
import React from 'react'
import { icons } from '../constants';

const SearchBar = () => {
    return (
        <View className="flex-row items-center justify-between px-4 py-2 bg-black-100">
            <TouchableOpacity>
                <icons.Bars3 color="white" size={24} />
            </TouchableOpacity>

            <View className="flex-row flex-1 w-full items-center bg-gray-800 rounded-full px-4 mx-2">
                <TextInput
                    className="flex-1 text-white py-2"
                    placeholder="Search"
                    placeholderTextColor="gray"
                //   style={{ paddingRight: 2 }} // Add padding to make space for the icon
                />
                <TouchableOpacity className="ml-2">
                    <icons.MagnifyingGlass color="#4ade80" size={24} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity>
                <icons.UserCircle color="white" size={36} />
            </TouchableOpacity>
        </View>

    )
}

export default SearchBar