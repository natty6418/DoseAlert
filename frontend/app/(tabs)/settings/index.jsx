import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

import { icons } from '../../../constants';


const SettingsScreen = () => {

    const settingsOptions = [
    { name: 'Account Info', description: 'Edit your personal and delivery info', icon: icons.profile, route: 'settings/AccountInfo' },
    { name: 'Emergency Info', description: 'Manage your emergency contact', icon: icons.phone, route: 'settings/EmergencyInfo' },
    { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.documents, route: 'settings/PrivacyPolicy' },
    { name: 'Logout', description: 'Logout of DoseAlert on this device', icon: icons.logout, route: '/(auth)/signout' },
    ];

    return (
     <SafeAreaView className="bg-black-100 h-full px-4">   
    <ScrollView className="flex-1 mt-3">
        <Text className="text-lime-400 text-2xl font-pbold">Settings</Text>


        {/* Grid layout for settings */}
        <View className="flex flex-wrap flex-row justify-between mt-4">
        {settingsOptions
            .map((option, index) => (
            <TouchableOpacity
                key={index}
                className="w-[48%] bg-[#232533] p-4 rounded-lg mb-4"
                onPress={() => router.push(option.route)}
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
    </SafeAreaView>
    );
};
  
export default SettingsScreen;