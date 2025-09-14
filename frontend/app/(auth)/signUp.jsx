import { useState } from "react";
import { Link, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, Dimensions, Image } from "react-native";
import { images } from "../../constants";
import CustomButton from "../../components/ui/CustomButton";
import FormField from "../../components/forms/FormField";
import ErrorModal from "../../components/modals/ErrorModal";
import { createNewAccount } from "../../services/UserHandler";
import { useAuth } from '../../contexts/AuthContext';

const SignUp = () => {
    const { storeTokens, loginAsGuest, isGuest, upgradeFromGuest } = useAuth();
    
    const [form, setForm] = useState({
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      password: "password@123",
    });
    // const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
  
    const handleSignUp = async () => {
      setLoading(true);
      try{
        const response = await createNewAccount(form.email, form.password, form.firstName, form.lastName);
        
        // If registration includes tokens (auto-login)
        if (response.access && response.refresh) {
          const tokens = {
            access: response.access,
            refresh: response.refresh
          };
          
          if (isGuest) {
            // Upgrade from guest to authenticated user
            await upgradeFromGuest(tokens, response.user);
          } else {
            // Regular sign up - store tokens and user data
            await storeTokens(tokens, response.user);
          }
          router.replace("/home");
        } else {
          // If no tokens, go to sign in page
          router.replace("/signIn");
        }
      } catch(error){
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    const handleSkip = async () => {
      try {
        await loginAsGuest();
        router.replace("/home");
      } catch (error) {
        console.error('Error during guest login:', error);
        setError('Failed to continue as guest. Please try again.');
      }
    };
  
    return (
      <SafeAreaView className="bg-primary h-full">
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
              Create an account
            </Text>
  
            <FormField
              title="First Name"
              value={form.firstName}
              handleChangeText={(e) => setForm({ ...form, firstName: e })}
              otherStyles="mt-7"
              testID="firstName"
            />
            <FormField
              title="Last Name"
              value={form.lastName}
              handleChangeText={(e) => setForm({ ...form, lastName: e })}
              otherStyles="mt-7"
              testID="lastName"
            />
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
                <Text>Sign In</Text>
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
            setError(null)
          }}
        />
        </ScrollView>
      </SafeAreaView>
    )
  }
  
  export default SignUp