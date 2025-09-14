// batchSync.js
// Batch sync functionality for efficient uploads

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from '../database.js';
import { eq } from 'drizzle-orm';
import { syncConfig } from './syncConfig.js';
import { makeAuthenticatedAPIRequest } from './apiUtils.js';
import { getDirtyItems, getBackendIdFromLocalId } from './dbUtils.js';

// Upload local changes for a table using batch sync endpoint
async function uploadLocalChangesWithBatch(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformToBackend, dependencies } = config;
  const results = { uploaded: 0, failed: 0, errors: [] };

  // Get dirty items for this user
  const dirtyItems = await getDirtyItems(table, userId);
  // console.log("Dirty Items: ", dirtyItems)
  if (dirtyItems.length === 0) {
    console.log(`No changes to upload for ${endpoint}`);
    return results;
  }

  const batchData = [];
  const itemMap = new Map(); // Map batch index to local item

  // Prepare batch data
  for (let i = 0; i < dirtyItems.length; i++) {
    const item = dirtyItems[i];
    // console.log("item: ", item.isDeleted)
    try {
      // Resolve dependencies: get backend IDs for foreign keys
      if (dependencies) {
        for (const [localKey, dependencyTable] of Object.entries(dependencies)) {
          const localId = item[localKey];
          const backendId = await getBackendIdFromLocalId(syncConfig[dependencyTable].table, localId);
          if (!backendId) {
            throw new Error(`Dependency not met: ${dependencyTable} with local ID ${localId} is not synced.`);
          }
          item[`${localKey.replace('Id', '')}BackendId`] = backendId;
        }
      }

      if (item.isDeleted) {
        // For deletion, we only need the backend ID and deletion flag
        if (item.backendId) {
          batchData.push({
            id: item.backendId,
            is_deleted: true
          });
          itemMap.set(batchData.length - 1, item);
        }
      } else {
        // For create/update, transform the data and include backend ID if exists
        const backendData = transformToBackend(item);
        // console.log("Backend Data: ", backendData)
        batchData.push({
          id: item.backendId || null, // null for new records
          ...backendData
        });
        itemMap.set(batchData.length - 1, item);
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ item: item.id, error: error.message });
    }
  }

  // console.log("batchData: ", batchData)

  if (batchData.length === 0) {
    return results;
  }

  try {
    console.log(`Uploading ${batchData.length} changes for ${endpoint}...`);
    // console.log("Batch Data: ", {batchData}) 
    // Use the batch sync endpoint
    const syncResults = await makeAuthenticatedAPIRequest(`${endpoint}sync/`, {
      method: 'POST',
      body: JSON.stringify(batchData),
    });

    // Process sync results and update local records
    for (let i = 0; i < syncResults.length; i++) {
      const syncResult = syncResults[i];
      const localItem = itemMap.get(i);

      if (!localItem) continue;

      if (syncResult.status === 'error') {
        results.failed++;
        results.errors.push({ item: localItem.id, error: syncResult.errors });
      } else {
        // Update local record based on sync result
        if (syncResult.status === 'deleted') {
          // Permanently delete the local record
          await db.delete(table).where(eq(table.id, localItem.id));
        } else {
          // Update or created - update local record
          const updateData = { 
            isDirty: false, 
            lastSynced: new Date().toISOString() 
          };
          
          if (syncResult.status === 'created') {
            updateData.backendId = syncResult.id;
          }
          
          await db.update(table).set(updateData).where(eq(table.id, localItem.id));
        }
        results.uploaded++;
      }
    }
  } catch (error) {
    console.error(`Batch upload failed for ${endpoint}:`, error);
    results.failed++;
    results.errors.push({ error: error.message });
  }

  return results;
}

// Main function to use batch sync endpoints for uploading local changes
export async function batchUploadSync(userId) {
  console.log('Starting batch upload sync...');
  const results = {};

  // Upload local changes for medications first (dependencies)
  const medConfig = syncConfig.medications;
  results.medications = await uploadLocalChangesWithBatch(medConfig, userId);

  // Upload other tables in dependency order
  const orderedTables = ['schedules', 'adherenceRecords']; // reminders would go here if implemented
  for (const key of orderedTables) {
    if (syncConfig[key]) {
      results[key] = await uploadLocalChangesWithBatch(syncConfig[key], userId);
    }
  }

  await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
  console.log('Batch upload sync completed.');
  return results;
}
