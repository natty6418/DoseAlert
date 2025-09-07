import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";

import { icons } from '../../../constants';
import { useAuth } from '../../../contexts/AuthContext';
import { logoutUser } from '../../../services/UserHandler';
import CustomButton from '../../../components/ui/CustomButton';


const SettingsScreen = () => {
    const { isGuest, clearTokens } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleSignOut = async () => {
        try {
            // Call the backend logout API to blacklist the refresh token
            await logoutUser();
            
            // Clear local tokens (logoutUser already does this, but keeping for safety)
            await clearTokens();
            
            // Close modal and navigate to sign in
            setShowLogoutModal(false);
            router.replace('/(auth)/signIn');
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if the API call fails, clear local tokens
            await clearTokens();
            setShowLogoutModal(false);
            router.replace('/(auth)/signIn');
        }
    };

    const authenticatedUserOptions = [
        { name: 'Account Info', description: 'Edit your personal and delivery info', icon: icons.profile, route: 'settings/AccountInfo' },
        
        { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.documents, route: 'settings/PrivacyPolicy' },
        { name: 'Logout', description: 'Logout of DoseAlert on this device', icon: icons.logout, route: '/(auth)/signout' },
    ];

    const guestUserOptions = [
        { name: 'Create Account / Sign In', description: 'Sync your data across devices', icon: icons.profile, route: '/(auth)/signIn', highlight: true },
        
        { name: 'Privacy Policy', description: 'See our terms and conditions', icon: icons.documents, route: 'settings/PrivacyPolicy' },
    ];

    const displayOptions = isGuest ? guestUserOptions : authenticatedUserOptions;

    return (
     <SafeAreaView className="bg-primary h-full px-4">   
    <ScrollView className="flex-1 mt-3">
        <Text className="text-white text-2xl font-pbold">Settings</Text>

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
                onPress={() => {
                    console.log('Navigating to:', option.route);
                    if (option.name === 'Logout') {
                        // Show logout confirmation modal
                        setShowLogoutModal(true);
                    } else {
                        router.push(option.route);
                    }
                }}
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

    {/* Logout Confirmation Modal */}
    <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
    >
        <View className="flex-1 justify-center items-center bg-black/50">
            <View className="w-3/4 bg-[#232533] px-5 py-10 rounded-2xl items-center justify-center gap-4">
                <Text className="text-white font-pmedium text-center text-lg">Are you sure?</Text>
                <Text className="text-[#CDCDE0] text-sm text-center mb-4">
                    You will be signed out of DoseAlert on this device.
                </Text>
                <View className="flex-row gap-4">
                    <CustomButton 
                        handlePress={() => setShowLogoutModal(false)}
                        title="Cancel" 
                        containerStyles="px-6 bg-gray-600" 
                    />
                    <CustomButton 
                        handlePress={handleSignOut}
                        title="Sign Out" 
                        containerStyles="px-6" 
                    />
                </View>
            </View>
        </View>
    </Modal>
    </SafeAreaView>
    );
};
  
export default SettingsScreen;