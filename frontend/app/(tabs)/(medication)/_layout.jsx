import React from 'react';
import { Stack } from 'expo-router';

const MedicationLayout = () => {
  return (
    <Stack>
      <Stack.Screen 
        name="create" 
        options={{ 
          title: "Manage Medications",
          headerShown: false // Since create.jsx uses SafeAreaView
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          title: "Add Medication",
          headerShown: false, // Since add.jsx has its own header
          presentation: "modal"
        }} 
      />
    </Stack>
  );
};

export default MedicationLayout;
