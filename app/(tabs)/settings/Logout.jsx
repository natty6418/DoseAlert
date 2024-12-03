import { View, Text } from 'react-native';
import React from 'react';
import CustomButton from '../../../components/CustomButton'; 
import { useFirebaseContext } from '../../../contexts/FirebaseContext';
import { signOut } from 'firebase/auth';
import { Link, router } from 'expo-router';


const Logout = () => {
    const { setIsLoggedIn, setUser } = useFirebaseContext();
  
    const handleSignOut = () => {
      console.log('Logging out');
      setUser(null);
      signOut(auth);
      setIsLoggedIn(false);
      router.replace('/'); // Redirect to login or home screen after logout
    };
  
    return (
      <View className="flex-1 justify-center items-center bg-[#161622]">
        <View className="w-3/4 bg-[#232533] px-5 py-10 rounded-2xl items-center justify-center gap-4">
          <Text className="text-white font-semibold text-center text-lg">Are you sure you want to sign out?</Text>
          <CustomButton handlePress={handleSignOut} title="Sign Out" containerStyles="px-7 bg-red-500" />
        </View>
      </View>
    );
  };
  
  export default Logout;