import { Stack } from 'expo-router';

export default function SettingLayout() {
    return (
        <Stack 
            initialRouteName='index'
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="AccountInfo" />
            <Stack.Screen name="PrivacyPolicy" />
            <Stack.Screen name="Notifications" />
            <Stack.Screen name="Security" />
            <Stack.Screen name="Help" />
            <Stack.Screen name="About" />
        </Stack>
    );
}