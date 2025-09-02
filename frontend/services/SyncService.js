// SyncService.js
// Handles syncing medication data between local SQLite and backend API using new schema

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from './UserHandler.js';
import { 
  getDirtyMedications, 
  createMedication, 
  updateMedication, 
  deleteMedication,
  markMedicationSynced,
  getMedicationsByUserId 
} from '../db/queries.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// API helper function with authentication
const makeAuthenticatedAPIRequest = async (endpoint, options = {}) => {
  const accessToken = await getStoredAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const url = `${BACKEND_URL}/api${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
    ...options,
  };

  console.log(`Making authenticated API request to: ${url}`);
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || errorData.message || 'API request failed');
  }

  return response.json();
};

// Transform local medication data to backend format
const transformToBackendFormat = (localMedication) => {
  return {
    name: localMedication.name,
    directions: localMedication.directions,
    side_effects: localMedication.sideEffects,
    purpose: localMedication.purpose,
    warnings: localMedication.warnings,
    dosage_amount: localMedication.dosageAmount,
    dosage_unit: localMedication.dosageUnit,
    notes: localMedication.notes,
    start_date: localMedication.startDate,
    end_date: localMedication.endDate,
    frequency: localMedication.frequency
  };
};

// Transform backend medication data to local format
const transformFromBackendFormat = (backendMedication, userId) => {
  return {
    backendId: backendMedication.id,
    userId: userId,
    name: backendMedication.name,
    directions: backendMedication.directions,
    sideEffects: backendMedication.side_effects,
    purpose: backendMedication.purpose,
    warnings: backendMedication.warnings,
    dosageAmount: backendMedication.dosage_amount,
    dosageUnit: backendMedication.dosage_unit,
    notes: backendMedication.notes,
    startDate: backendMedication.start_date,
    endDate: backendMedication.end_date,
    frequency: backendMedication.frequency,
    isDirty: false, // Just synced from backend
    lastSynced: new Date().toISOString()
  };
};

// Sync all local dirty medications to backend
export async function syncLocalToBackend(userId) {
  try {
    console.log('Starting sync from local to backend...');
    
    // Get only dirty (modified) local medications for this user
    const dirtyMedications = await getDirtyMedications(userId);
    
    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const medication of dirtyMedications) {
      try {
        const backendData = transformToBackendFormat(medication);
        
        if (medication.isDeleted) {
          // Delete from backend if it has a backend ID
          if (medication.backendId) {
            await makeAuthenticatedAPIRequest(`/meds/${medication.backendId}/`, {
              method: 'DELETE'
            });
            console.log(`Deleted medication from backend: ${medication.name}`);
          }
          // Mark as synced (will be cleaned up later)
          await markMedicationSynced(medication.id);
        } else if (medication.backendId) {
          // Update existing medication on backend
          const updatedMed = await makeAuthenticatedAPIRequest(`/meds/${medication.backendId}/`, {
            method: 'PUT',
            body: JSON.stringify(backendData)
          });
          
          // Mark as synced
          await markMedicationSynced(medication.id, updatedMed.id);
          console.log(`Updated medication on backend: ${medication.name}`);
        } else {
          // Create new medication on backend
          const createdMed = await makeAuthenticatedAPIRequest('/meds/', {
            method: 'POST',
            body: JSON.stringify(backendData)
          });
          
          // Mark as synced with new backend ID
          await markMedicationSynced(medication.id, createdMed.id);
          console.log(`Created medication on backend: ${medication.name}`);
        }
        
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          medication: medication.name,
          error: error.message
        });
        console.error(`Failed to sync medication ${medication.name}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing local to backend:', error);
    throw error;
  }
}

// Sync all backend medications to local (preventing duplicates)
export async function syncBackendToLocal(userId) {
  try {
    console.log('Starting sync from backend to local...');
    
    // Get all medications from backend
    const backendMedications = await makeAuthenticatedAPIRequest('/meds/');
    
    // Get all local medications to check for existing ones
    const localMedications = await getMedicationsByUserId(userId);
    const localByBackendId = new Map();
    localMedications.forEach(med => {
      if (med.backendId) {
        localByBackendId.set(med.backendId, med);
      }
    });
    
    const results = {
      synced: 0,
      failed: 0,
      errors: []
    };

    for (const backendMed of backendMedications) {
      try {
        const localData = transformFromBackendFormat(backendMed, userId);
        
        if (localByBackendId.has(backendMed.id)) {
          // Update existing local medication
          const existingLocal = localByBackendId.get(backendMed.id);
          await updateMedication(existingLocal.id, {
            ...localData,
            isDirty: false, // Just synced
            lastSynced: new Date().toISOString()
          });
          console.log(`Updated local medication: ${backendMed.name}`);
        } else {
          // Create new local medication
          await createMedication(localData);
          console.log(`Created local medication: ${backendMed.name}`);
        }
        
        results.synced++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          medication: backendMed.name,
          error: error.message
        });
        console.error(`Failed to sync medication ${backendMed.name} from backend:`, error);
      }
    }

    // Mark any local medications that weren't found on backend as deleted
    // (assuming they were deleted on backend by another device)
    const backendIds = new Set(backendMedications.map(m => m.id));
    for (const localMed of localMedications) {
      if (localMed.backendId && !backendIds.has(localMed.backendId) && !localMed.isDeleted) {
        try {
          await updateMedication(localMed.id, {
            isDeleted: true,
            isDirty: false, // Already deleted on backend
            lastSynced: new Date().toISOString()
          });
          console.log(`Marked local medication as deleted: ${localMed.name}`);
        } catch (error) {
          console.error(`Failed to mark medication as deleted: ${localMed.name}`, error);
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error syncing backend to local:', error);
    throw error;
  }
}

// Incremental sync - only sync changes since last sync
export async function incrementalSync(userId) {
  try {
    console.log('Starting incremental sync...');
    
    // Only sync dirty (changed) local data to backend
    const uploadResults = await syncLocalToBackend(userId);
    
    // Only download new data from backend based on last sync time
    const lastSync = await getLastSyncTime();
    let downloadResults = { synced: 0, failed: 0, errors: [] };
    
    if (!lastSync || await isSyncNeeded(1)) { // Sync if more than 1 hour
      downloadResults = await syncBackendToLocal(userId);
    }
    
    // Store last sync timestamp
    await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
    
    return {
      upload: uploadResults,
      download: downloadResults,
      lastSync: new Date().toISOString(),
      type: 'incremental'
    };
  } catch (error) {
    console.error('Error during incremental sync:', error);
    throw error;
  }
}

// Full bidirectional sync (typically used on login or initial sync)
export async function fullSync(userId) {
  try {
    console.log('Starting full bidirectional sync...');
    
    // Push all dirty local data to backend
    const uploadResults = await syncLocalToBackend(userId);
    
    // Pull all data from backend and reconcile with local
    const downloadResults = await syncBackendToLocal(userId);
    
    // Store last sync timestamp
    await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
    
    return {
      upload: uploadResults,
      download: downloadResults,
      lastSync: new Date().toISOString(),
      type: 'full'
    };
  } catch (error) {
    console.error('Error during full sync:', error);
    throw error;
  }
}

// Get last sync time
export async function getLastSyncTime() {
  try {
    return await AsyncStorage.getItem('lastSyncTime');
  } catch (error) {
    console.error('Error getting last sync time:', error);
    return null;
  }
}

// Check if sync is needed (e.g., if it's been more than X hours)
export async function isSyncNeeded(hoursThreshold = 24) {
  try {
    const lastSync = await getLastSyncTime();
    
    if (!lastSync) {
      return true; // Never synced before
    }
    
    const lastSyncTime = new Date(lastSync);
    const now = new Date();
    const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);
    
    return hoursSinceSync >= hoursThreshold;
  } catch (error) {
    console.error('Error checking if sync is needed:', error);
    return true; // Default to needing sync if we can't determine
  }
}

// Clean up soft-deleted records that have been synced
export async function cleanupDeletedRecords(userId) {
  try {
    console.log('Cleaning up soft-deleted records...');
    
    const allMedications = await getMedicationsByUserId(userId);
    const deletedAndSynced = allMedications.filter(med => 
      med.isDeleted && !med.isDirty && med.lastSynced
    );
    
    let cleanedCount = 0;
    for (const medication of deletedAndSynced) {
      try {
        // Permanently delete from local database
        await deleteMedication(medication.id);
        cleanedCount++;
        console.log(`Permanently deleted: ${medication.name}`);
      } catch (error) {
        console.error(`Failed to cleanup medication ${medication.name}:`, error);
      }
    }
    
    return { cleanedCount };
  } catch (error) {
    console.error('Error cleaning up deleted records:', error);
    throw error;
  }
}
