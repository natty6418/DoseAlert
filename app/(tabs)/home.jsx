import { View, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import React, { useEffect, useState } from 'react'
import Greeting from '../../components/Greeting';
import SearchBar from '../../components/SearchBar';
import MedicationItem from '../../components/MedicationItem';
import Footer from '../../components/Footer';
import { router } from 'expo-router';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { getUser } from '../../services/firebaseDatabase';
import { getMedications } from '../../services/firebaseDatabase';
import LoadingSpinner from '../../components/Loading';


const Home = () => {
  const [loading, isLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const context = useFirebaseContext();
  useEffect(()=>{
    if(!context.isLoggedIn) router.replace('/signIn');
    try{
      const fetchUser = async () => {
        console.log(context.user.uid);
        const user = await getUser(context.user.uid);
        console.log(user);
        setUser(user);
        isLoading(false);
      }
      fetchUser();
    } catch(error){
      console.log(error);
    }
  },[])

  useEffect(()=>{
    try{
      const fetchMedications = async () => {
        const meds = await getMedications(context.user.uid);
        console.log("meds ", meds);
        setMedications(meds);
      }
      fetchMedications();
    } catch(error){
      console.log(error);
    }finally{
      isLoading(false);
    }
  },[])

  return(
    <SafeAreaView className="bg-black-100 h-full py-4">
    <View className="flex-1 h-full">
      <SearchBar />
      <ScrollView>
        <Greeting name={user?.firstName}/>
        
        {loading ? (
  <LoadingSpinner />
) : (
  <View className="px-4 mt-2">
    <Text className="text-gray-400 text-lg mb-2">User's Inventory</Text>
    {medications.length > 0 ? (
      medications.map((med, index) => (
        <MedicationItem key={index} name={med.medicationSpecification.name} time={med.time} />
      ))
    ) : (
      <Text className="text-gray-500 text-center mt-4">No medications found.</Text>
    )}
  </View>
)}
        
        <TouchableOpacity 
      className="bg-gray-900 p-4 rounded-xl mx-4 mt-2 border border-lime-500 shadow-lg active:opacity-80"
      onPress={() => router.push('/create')}
    >
      <Text className="text-lime-400 text-center text-xl font-semibold">+ Add More</Text>
    </TouchableOpacity>
        <Footer/>
      </ScrollView>
    </View>
    </SafeAreaView>
  ) 
}

export default Home