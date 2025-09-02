import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

import { icons } from '../../../constants';
import { useAuth } from '../../../contexts/AuthContext';


const SettingsScreen = () => {
    const { isGuest } = useAuth();

    const authenticatedUserOptions = [
        { name: 'Account Info', description: 'Edit your personal and delivery info', icon: icons.profile, route: 'settings/AccountInfo' },
        { name: 'Emergency Info', description: 'Manage your emergency contact', icon: icons.phone, route: 'settings/EmergencyInfo' },
        { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.documents, route: 'settings/PrivacyPolicy' },
        { name: 'Logout', description: 'Logout of DoseAlert on this device', icon: icons.logout, route: '/(auth)/signout' },
    ];

    const guestUserOptions = [
        { name: 'Create Account / Sign In', description: 'Sync your data across devices', icon: icons.profile, route: '/(auth)/signIn', highlight: true },
        { name: 'Emergency Info', description: 'Manage your emergency contact', icon: icons.phone, route: 'settings/EmergencyInfo' },
        { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.documents, route: 'settings/PrivacyPolicy' },
    ];

    const displayOptions = isGuest ? guestUserOptions : authenticatedUserOptions;

    return (
     <SafeAreaView className="bg-black-100 h-full px-4">   
    <ScrollView className="flex-1 mt-3">
        <Text className="text-lime-400 text-2xl font-pbold">Settings</Text>

        {isGuest && (
            <View className="bg-orange-500/20 border border-orange-500 rounded-lg p-4 mt-4">
                <Text className="text-orange-400 font-psemibold text-sm">
                    You&apos;re using DoseAlert as a guest. Create an account to sync your data across devices and never lose your medication information.
                </Text>
            </View>
        )}

        {/* Grid layout for settings */}
        <View className="flex flex-wrap flex-row justify-between mt-4">
        {displayOptions
            .map((option, index) => (
            <TouchableOpacity
                key={index}
                className={`w-[48%] ${
                    option.highlight 
                        ? 'bg-secondary-200/20 border border-secondary-200' 
                        : 'bg-[#232533]'
                } p-4 rounded-lg mb-4`}
                onPress={() => router.push(option.route)}
            >
                <View className="flex items-center justify-center mb-2">
                <Image 
                    source={option.icon} 
                    className="w-10 h-10" 
                    tintColor="#c0ee77"
                />
                </View>
                <Text className={`font-semibold text-base text-center ${
                    option.highlight 
                        ? 'text-secondary-200' 
                        : 'text-white'
                }`}>
                    {option.name}
                </Text>
                <Text className="text-[#CDCDE0] text-xs text-center">{option.description}</Text>
            </TouchableOpacity>
            ))}
        </View>
    </ScrollView>
    </SafeAreaView>
    );
};
  
export default SettingsScreen;