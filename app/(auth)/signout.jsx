import { View, Text } from 'react-native'
import React from 'react'
import CustomButton from '../../components/CustomButton'
import { useFirebaseContext } from '../../contexts/FirebaseContext'
import { router } from "expo-router";
import { logOut } from '../../services/UserHandler';

const SignOutPage = () => {
    const { setIsLoggedIn, setUser } = useFirebaseContext();
    const handleSignOut = () => {
        console.log('signing out')
        logOut();
        setUser(null);
        setIsLoggedIn(false);
        router.replace('/');
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