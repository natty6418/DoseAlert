import { View, ScrollView, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

import React, { useEffect, useState } from 'react'
import Greeting from '../../components/Greeting';
import MedicationItem from '../../components/MedicationItem';
import Footer from '../../components/Footer';
import { router } from 'expo-router';
import { useFirebaseContext } from '../../contexts/FirebaseContext';
import { getUser } from '../../services/firebaseDatabase';
import { getMedications } from '../../services/firebaseDatabase';
import LoadingSpinner from '../../components/Loading';
import { icons, images } from '../../constants';


const Home = () => {
  const [loading, isLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const context = useFirebaseContext();
  useEffect(() => {
    if (!context.isLoggedIn) router.replace('/signIn');
    try {
      const fetchUser = async () => {
        const user = await getUser(context.user.uid);
        setUser(user);
        isLoading(false);
      }
      fetchUser();
    } catch (error) {
      console.log(error);
    }
  }, [])

  useEffect(() => {
    try {
      const fetchMedications = async () => {
        const meds = await getMedications(context.user.uid);
        setMedications(meds);
      }
      fetchMedications();
    } catch (error) {
      console.log(error);
    } finally {
      isLoading(false);
    }
  }, [])

  return (
    <SafeAreaView className="bg-black-100 h-full py-4">
      <View className="flex-1 h-full">
        <View className="flex-row items-center justify-between px-4 py-2 rounded-b-2xl">
          <TouchableOpacity>
            <icons.Bars3 color="#FFFFFF" size={36} />
          </TouchableOpacity>

          <View className="items-center">
            <Image source={images.logo} resizeMode="contain" className="w-[115px] h-[34px]" />
          </View>

          <TouchableOpacity>
            <icons.UserCircle color="#A3E635" size={36} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          <Greeting name={user?.firstName} />

          {loading ? (
            <LoadingSpinner />
          ) : (
            <View className="px-4 mt-2">
              <Text className="text-gray-400 text-lg mb-2">Inventory</Text>
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
          <Footer />
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default Home