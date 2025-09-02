import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuth } from '../../contexts/AuthContext';

const AuthLayout = () => {
  const { isLoggedIn } = useAuth();

  // Only redirect if user is logged in with actual credentials, not if they're a guest
  if (isLoggedIn()) {
    return <Redirect href="/home" />;
  }

  return (
    <>
    <Stack>
      <Stack.Screen 
        name="signIn"
        options={
          {
            headerShown: false
          }
        }
      />
      <Stack.Screen 
        name="signUp"
        options={
          {
            headerShown: false
          }
        }
      />
      <Stack.Screen 
        name="signout"
        options={
          {
            headerShown: false
          }
        }
      />
    </Stack>
    
    <StatusBar
        backgroundColor='#161622'
        style='light'
    />
    </>
  )
}

export default AuthLayout