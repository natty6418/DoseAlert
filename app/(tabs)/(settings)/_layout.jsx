import { useEffect } from 'react';
import Providers from '../../../contexts'
import { Stack } from 'expo-router';



export default function SettingLayout() {
    return (
      <Providers>
        <Stack >
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="AccountInfo" options={{headerShown: false}} />
        <Stack.Screen name="EmergencyInfo" options={{headerShown: false}} />
        </Stack>
      </Providers>
    );
  }