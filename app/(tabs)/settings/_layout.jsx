import { Stack } from 'expo-router';



export default function SettingLayout() {
    return (
        <Stack initialRouteName='index' >
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="AccountInfo" options={{headerShown: false}} />
        <Stack.Screen name="EmergencyInfo" options={{headerShown: false}} />
        <Stack.Screen name='PrivacyPolicy' options={{headerShown: false}} />
        </Stack>
    );
  }