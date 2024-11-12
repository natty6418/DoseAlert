import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Alert, Image } from "react-native";
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";
import { createNewUser } from "../../services/firebaseDatabase";

const signUp = () => {
    const [form, setForm] = useState({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
  
    const handleSignUp = async () => {
      setLoading(true);
      try{
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const user = userCredential.user;
        console.log(user);
        setUser(user);
        await createNewUser({
          uid: user.uid,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
        });
        router.replace("/home");
      } catch(error){
        console.log(error);
        Alert.alert("Error", error.message);
      } finally {
        setLoading(false);
      }
    }
  
    return (
      <SafeAreaView className="bg-black-100 h-full">
        <ScrollView>
          <View
            className="w-full flex justify-center px-4 my-6"
            style={{
              minHeight: Dimensions.get("window").height - 100,
            }}
          >
            <Image
              source={images.logo}
              resizeMode="contain"
              className="w-[115px] h-[34px]"
            />
  
            <Text className="text-2xl font-semibold text-white mt-10 font-psemibold">
              Log in to DoseAlert
            </Text>
  
            <FormField
              title="First Name"
              value={form.firstName}
              handleChangeText={(e) => setForm({ ...form, firstName: e })}
              otherStyles="mt-7"
            />
            <FormField
              title="Last Name"
              value={form.lastName}
              handleChangeText={(e) => setForm({ ...form, lastName: e })}
              otherStyles="mt-7"
            />
            <FormField
              title="Email"
              value={form.email}
              handleChangeText={(e) => setForm({ ...form, email: e })}
              otherStyles="mt-7"
              keyboardType="email-address"
            />
  
            <FormField
              title="Password"
              value={form.password}
              handleChangeText={(e) => setForm({ ...form, password: e })}
              otherStyles="mt-7"
            />
  
            <CustomButton
              title="Sign Up"
              handlePress={handleSignUp}
              containerStyles="mt-7 bg-secondary-200"
              isLoading={loading}
            />
  
            <View className="flex justify-center pt-5 flex-row gap-2">
              <Text className="text-lg text-gray-100 font-pregular">
                Already have an account?
              </Text>
              <Link
                href="/signIn"
                className="text-lg font-psemibold text-secondary"
              >
                Sign In
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
  
  export default signUp