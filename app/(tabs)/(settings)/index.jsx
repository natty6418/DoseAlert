import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
// import { SafeAreaView } from "react-native-safe-area-context";

import { icons, images } from '../../../constants';


const SettingsScreen = ({ navigation }) => {

    const settingsOptions = [
    { name: 'Account Info', description: 'Edit your personal and delivery info', icon: icons.profile, route: 'AccountInfo' },
    { name: 'Emergency Info', description: 'Manage your emergency contact', icon: icons.phone, route: 'EmergencyInfo' },
    { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.ClipboardDocument, route: 'PrivacyPolicy' },
    { name: 'Logout', description: 'Logout of DoseAlert on this device', icon: icons.logout, route: '/(auth)/signout' },
    ];

    return (
    <ScrollView className="flex-1 bg-[#161622] p-4">
        <Text className="text-white text-2xl font-semibold mb-4">DoseAlert Settings</Text>


        {/* Grid layout for settings */}
        <View className="flex flex-wrap flex-row justify-between mt-4">
        {settingsOptions
            .filter((option) =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((option, index) => (
            <TouchableOpacity
                key={index}
                className="w-[48%] bg-[#232533] p-4 rounded-lg mb-4"
                onPress={() => navigation.navigate(option.route)}
            >
                <View className="flex items-center justify-center mb-2">
                <Image source={option.icon} className="w-10 h-10" tintColor="#c0ee77" />
                </View>
                <Text className="text-white font-semibold text-base text-center">{option.name}</Text>
                <Text className="text-[#CDCDE0] text-xs text-center">{option.description}</Text>
            </TouchableOpacity>
            ))}
        </View>
    </ScrollView>
    );
};
  
export default SettingsScreen;