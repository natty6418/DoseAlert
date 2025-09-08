import { StatusBar } from "expo-status-bar";
import {  router } from "expo-router";
import { View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../components/ui/CustomButton";
import { images } from "../constants";
import "../global.css";
import { useAuth } from "../contexts/AuthContext";


export default function App() {

  const {  loginAsGuest } = useAuth();
  
  

  const handleContinueAsGuest = async () => {
    try {
      await loginAsGuest();
      router.replace("/home");
    } catch (error) {
      console.error('Error during guest login:', error);
    }
  };

  return (
    <SafeAreaView className="bg-black-100 h-full">
    <ScrollView
    contentContainerStyle={{
      height: "100%",
    }}
  >
    <View className="w-full flex justify-center items-center h-full px-4">
      <Image
        source={images.logo}
        className="w-[200px] h-[84px]"
        resizeMode="contain"
      />

      <Image
        source={images.person}
        className="max-w-[380px] w-full h-[298px] mx-auto"
        resizeMode="contain"
      />

      <View className="relative mt-5">
        <Text className="text-3xl text-white font-bold text-center">
        Medication made simple,{"\n"}
        with{" "}
          <Text className="text-secondary-200">DoseAlert</Text>
        </Text>

        <Image
          source={images.path}
          className="w-[136px] h-[15px] absolute -bottom-3 -right-0"
          resizeMode="contain"
        />
      </View>

      <Text className="text-sm font-pregular text-gray-100 mt-7 text-center">
      Your personal medication manager designed to keep you on track with your health.
      </Text>

      <Text className="text-lg font-psemibold text-white mt-8 text-center">
        How would you like to get started?
      </Text>

      <CustomButton
      title="Create Account / Sign In"
      handlePress={()=>router.push('/signIn')}
      containerStyles='w-full mt-6 bg-secondary-200'
      />

      <CustomButton
      title="Continue Without Account"
      handlePress={handleContinueAsGuest}
      containerStyles='w-full mt-4 bg-gray-600'
      />

      <Text className="text-xs font-pregular text-gray-100 mt-4 text-center px-2">
        You can always create an account later to sync your data across devices
      </Text>
    </View>
  </ScrollView>
  <StatusBar backgroundColor="#161622" style=""/>
    </SafeAreaView>
  );
}

