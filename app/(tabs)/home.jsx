import { View, Text } from 'react-native'
import React from 'react'
import CustomButton from '../../components/CustomButton'
import { useFirebaseContext } from '../../contexts/FirebaseContext'
import { Link, router } from "expo-router";
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';

const Home = () => {
  const {setIsLoggedIn, setUser} = useFirebaseContext()
  return (
    <View className='flex flex-col justify-center align-middle bg-black-100 h-full'>
      <Text>Home</Text>
      <CustomButton title="Sign Out" handlePress={()=>{
        setUser(null);
        setIsLoggedIn(false);
        signOut(auth);
        router.replace('/');
      }} />
    </View>
  )
}

export default Home