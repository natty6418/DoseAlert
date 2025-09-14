import { View, Text } from 'react-native'
import React from 'react'
import CustomButton from '../../components/ui/CustomButton'
import { useAuth } from '../../contexts/AuthContext'
import { router } from "expo-router";
import { logoutUser } from '../../services/UserHandler';

const SignOutPage = () => {
    const { clearTokens } = useAuth();
    
    const handleSignOut = async () => {
        try {
            // Call the backend logout API to blacklist the refresh token
            await logoutUser();
            
            // Clear local tokens (logoutUser already does this, but keeping for safety)
            await clearTokens();
            
            // Navigate to sign in
            router.replace('/signIn');
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if the API call fails, clear local tokens
            await clearTokens();
            router.replace('/signIn');
        }
    }
    
    return (
        <View className="flex justify-center items-center bg-black-100 h-full">
            <View className="w-3/4 bg-black-200 px-5 py-10 rounded-2xl items-center justify-center gap-4">
                <Text className="text-white font-pmedium text-center text-lg">Are you sure?</Text>
                <CustomButton handlePress={handleSignOut} title="Sign Out" containerStyles='px-7' />
            </View>
        </View>

    )
}

export default SignOutPage