import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import React from 'react'
import Greeting from '../../components/Greeting';
import SearchBar from '../../components/SearchBar';
import MedicationItem from '../../components/MedicationItem';
import Footer from '../../components/Footer';
import { router } from 'expo-router';



const Home = () => {
  return(
    <SafeAreaView className="bg-black-100 h-full py-4">
    <View className="flex-1 h-full">
      <SearchBar />
      <ScrollView>
        <Greeting />
        
        <View className="px-4 mt-2">
          <Text className="text-gray-400 text-lg mb-2">User's Inventory</Text>
          <MedicationItem name="Aspirin" time="10:00 AM" />
          <MedicationItem name="Antacid" time="06:00 PM" />
          <MedicationItem name="Tylenol" time="08:00 PM" />
        </View>
        
        <TouchableOpacity className="bg-gray-700 p-4 rounded-lg mx-4 mt-2" onPress={()=>router.push('/create')}>
          <Text className="text-white text-center">+ Add more</Text>
        </TouchableOpacity>
        <Footer/>
      </ScrollView>
    </View>
    </SafeAreaView>
  ) 
}

export default Home