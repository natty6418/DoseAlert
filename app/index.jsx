import { StatusBar } from "expo-status-bar";
import { Redirect, router } from "expo-router";
import { View, Text, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../components/CustomButton";
import { images } from "../constants";
import "../global.css";
import { useFirebaseContext } from "../contexts/FirebaseContext";


export default function App() {
  const context = useFirebaseContext();
  if(!context.loading && context.isLoggedIn) return <Redirect href="/home" />
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
        <Text className="text-3xl text-primary font-bold text-center">
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
      <CustomButton
      title="Continue with Email"
      handlePress={()=>router.push('/signIn')}
      containerStyles='w-full mt-7 bg-secondary-200'
      />
    </View>
  </ScrollView>
  <StatusBar backgroundColor="#161622" style=""/>
    </SafeAreaView>
  );
}

