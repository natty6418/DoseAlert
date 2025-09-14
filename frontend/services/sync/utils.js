// utils.js
// Utility functions for sync operations

import AsyncStorage from '@react-native-async-storage/async-storage';

// Get the last sync timestamp
export async function getLastSyncTime() {
  return AsyncStorage.getItem('lastSyncTime');
}

// Check if sync is needed based on time threshold
export async function isSyncNeeded(hoursThreshold = 24) {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;
  const hoursSinceSync = (new Date() - new Date(lastSync)) / (1000 * 60 * 60);
  return hoursSinceSync >= hoursThreshold;
}

// Set the last sync timestamp
export async function setLastSyncTime() {
  await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
}
