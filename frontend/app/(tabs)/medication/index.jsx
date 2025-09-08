import { Redirect } from 'expo-router';

// Default route for medication folder - redirect to create page
export default function MedicationIndex() {
  return <Redirect href="/(tabs)/(medication)/create" />;
}
