import React from 'react'
import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Image } from "react-native";
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../../services/firebaseConfig';
import { images } from "../../constants";
import CustomButton from "../../components/CustomButton";
import FormField from "../../components/FormField";
import ErrorModal from '../../components/ErrorModal';
// import { logIn } from '../../services/UserHandler';
import { loginUser } from '../../services/UserHandler';
import { useAuth } from '../../contexts/AuthContext';

const SignIn = () => {
    const { refreshAuthState, loginAsGuest, isGuest, upgradeFromGuest } = useAuth();

    const [form, setForm] = useState({
        email: "",
        password: "",
      });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async () => {
      setLoading(true);
      try {
        // Login and let the service handle token storage
        const response = await loginUser(form.email, form.password);
        
        // If user was a guest, upgrade to authenticated user
        if (isGuest && response.access && response.refresh) {
          await upgradeFromGuest(response, response.user);
        } else {
          // Regular login flow
          // Refresh the auth context state from storage
          await refreshAuthState();
        }
        
        router.replace("/home");
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    const handleSkip = async () => {
      try {
        await loginAsGuest();
        // AuthLayout will handle the redirect automatically
      } catch (error) {
        console.error('Error during guest login:', error);
        setError('Failed to continue as guest. Please try again.');
      }
    };
    
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
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mt-7"
            keyboardType="email-address"
            testID="email"
          />

          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mt-7"
            testID="password"
          />

          <CustomButton
            title="Sign In"
            handlePress={handleLogin}
            containerStyles="mt-7 bg-secondary-200"
            isLoading={loading}
          />

          <View className="flex justify-center pt-5 flex-row gap-2">
            <Text className="text-lg text-gray-100 font-pregular">
              Don&apos;t have an account?
            </Text>
            <Link
              href="/signUp"
              className="text-lg font-psemibold text-secondary"
            >
            <Text>
            Signup
            </Text>
            </Link>
          </View>

          <CustomButton
            title="Continue as Guest"
            handlePress={handleSkip}
            containerStyles="mt-4 bg-gray-600"
            textStyles="text-gray-300"
          />
        </View>
        <ErrorModal
          visible={error !== null}
          message={error}
          onClose={() => {
            setForm({ email: "", password: "" });
            setError(null)
          }}
        />
      </ScrollView>

    </SafeAreaView>
  )
}

export default SignIn