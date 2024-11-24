import { useEffect } from 'react';
import Providers from '../../../contexts'


export default function SettingLayout() {
    return (
      <Providers>
        <Stack >
        <Stack.Screen name="index" options={{headerShown: false}} />

        </Stack>
      </Providers>
    );
  }