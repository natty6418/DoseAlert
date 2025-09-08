import { useFonts } from 'expo-font';
import { Stack, SplashScreen, router, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Providers from '../contexts';
import { useApp } from '../contexts/AppContext';
import Loading from '../components/ui/Loading';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/Scheduler';
import { registerBackgroundTasks } from '../services/BackgroundTasks.js';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = () => {
  const { isLoading } = useApp();
  const initialNotificationNav = useRef(null);
  const { hasUserMadeChoice, isAuthenticated } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    registerBackgroundTasks();
  }, []);

  // Notification listener setup
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const medicationId = response.notification.request.content.data.medicationId;
      if (medicationId) {
        initialNotificationNav.current = { 
            pathname: `/response/${medicationId}`,
            params: {
                reminderId: response.notification.request.content.data.reminderId || '',
                scheduledTime: response.notification.request.content.data.scheduledTime || new Date().toISOString()
            }
        };
      }
    });
    return () => subscription.remove();
  }, []);

  // Main navigation logic effect
  useEffect(() => {
    if (!navigationState?.key) return; // Navigator not ready

    // 1. Handle notification navigation first
    if (initialNotificationNav.current) {
      router.replace(initialNotificationNav.current);
      initialNotificationNav.current = null;
      return;
    }

    // 2. If no notification, handle auth redirect
    if (!hasUserMadeChoice()) return; // Auth not ready

    const inAuthGroup = segments[0] === '(auth)';
    const onIndexScreen = segments.length === 0;

    if (isAuthenticated()) {
      if (onIndexScreen || inAuthGroup) {
        router.replace('/(tabs)/home');
      }
    } else {
      if (!inAuthGroup && !onIndexScreen) {
        router.replace('/signIn');
      }
    }
  }, [navigationState, hasUserMadeChoice, isAuthenticated, segments]);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        hidden={false}
        backgroundColor='#1a1a1a'
        style='light'
      />
      <Stack initialRouteName='index'>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="response/[medicationId]" options={{ headerShown: false }} />
      </Stack>
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
        }}>
          <Loading />
        </View>
      )}
    </View>
  );
};

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) throw new Error(error);
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  if (!fontsLoaded && !error) return null;

  return (
    <Providers>
      <AppLayout />
    </Providers>
  );
}