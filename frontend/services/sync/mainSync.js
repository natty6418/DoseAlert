// mainSync.js
// Main sync orchestration functions

import { syncConfig } from './syncConfig.js';
import { batchUploadSync } from './batchSync.js';
import { syncBackendToLocalForTable, syncLocalToBackendForTableIndividual } from './individualSync.js';
import { setLastSyncTime, isSyncNeeded } from './utils.js';

// Full sync: upload local changes + download all server data
export async function fullSync(userId) {
  console.log('Starting full bidirectional sync...');
  const results = {};

  // Try batch upload first, then do downloads separately if needed
  try {
    // Upload local changes using batch sync
    const uploadResults = await batchUploadSync(userId);
    results.uploads = uploadResults;
    
    // For downloads, use the traditional approach
    // Sync medications first as other tables depend on it
    const medConfig = syncConfig.medications;
    results.medications_download = await syncBackendToLocalForTable(medConfig, userId);

    // Sync other tables
    for (const key in syncConfig) {
      if (key === 'medications') continue;
      const config = syncConfig[key];
      results[`${key}_download`] = await syncBackendToLocalForTable(config, userId);
    }

    await setLastSyncTime();
    console.log('Full sync completed with batch uploads.');
    return results;
  } catch (error) {
    console.warn('Batch upload failed, falling back to individual sync:', error.message);
    
    // Fallback to original individual sync approach
    const medConfig = syncConfig.medications;
    results.medications_upload = await syncLocalToBackendForTableIndividual(medConfig, userId);
    results.medications_download = await syncBackendToLocalForTable(medConfig, userId);

    // Sync other tables
    for (const key in syncConfig) {
      if (key === 'medications') continue;
      const config = syncConfig[key];
      results[`${key}_upload`] = await syncLocalToBackendForTableIndividual(config, userId);
      results[`${key}_download`] = await syncBackendToLocalForTable(config, userId);
    }

    await setLastSyncTime();
    console.log('Full sync completed with fallback.');
    return results;
  }
}

// Incremental sync: upload changes + conditional download
export async function incrementalSync(userId) {
  console.log('Starting incremental sync...');
  
  // Try batch upload for local changes, then download if needed
  try {
    const results = {};
    
    // Upload local changes using batch sync
    results.uploads = await batchUploadSync(userId);
    
    // Download all data from backend if sync is needed
    // A true incremental download would require the backend to support a `since` timestamp.
    if (await isSyncNeeded(1)) { // Sync if more than 1 hour
      for (const key in syncConfig) {
        results[`${key}_download`] = await syncBackendToLocalForTable(syncConfig[key], userId);
      }
    }
  
    await setLastSyncTime();
    console.log('Incremental sync completed with batch uploads.');
    return results;
  } catch (error) {
    console.warn('Batch incremental sync failed, falling back to individual sync:', error.message);
    
    const results = {};
  
    // Upload changes for all tables, respecting dependencies
    for (const key in syncConfig) {
      results[`${key}_upload`] = await syncLocalToBackendForTableIndividual(syncConfig[key], userId);
    }
  
    // Download all data from backend for now.
    // A true incremental download would require the backend to support a `since` timestamp.
    if (await isSyncNeeded(1)) { // Sync if more than 1 hour
      for (const key in syncConfig) {
        results[`${key}_download`] = await syncBackendToLocalForTable(syncConfig[key], userId);
      }
    }
  
    await setLastSyncTime();
    console.log('Incremental sync completed.');
    return results;
  }
}
