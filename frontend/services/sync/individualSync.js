// individualSync.js
// Individual sync operations (fallback when batch sync fails)

import { getDatabase } from '../database.js';
import { eq, and } from 'drizzle-orm';
import { syncConfig } from './syncConfig.js';
import { makeAuthenticatedAPIRequest } from './apiUtils.js';
import { getBackendIdFromLocalId, getLocalIdFromBackendId } from './dbUtils.js';

// Sync local changes to backend using individual API calls
export async function syncLocalToBackendForTable(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformToBackend, dependencies } = config;

  // CRITICAL: Filter by userId to prevent syncing other users' data
  const dirtyItems = await db.select().from(table).where(and(
    eq(table.isDirty, true),
    eq(table.userId, userId)
  ));
  
  if (dirtyItems.length === 0) {
    return { synced: 0, failed: 0, errors: [] };
  }

  const results = { synced: 0, failed: 0, errors: [] };
  const batchData = [];

  // Prepare batch data for sync endpoint
  for (const item of dirtyItems) {
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
        }
      } else {
        // For create/update, transform the data and include backend ID if exists
        const backendData = transformToBackend(item);
        batchData.push({
          id: item.backendId || null, // null for new records
          ...backendData
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ item: item.id, error: error.message });
    }
  }

  if (batchData.length === 0) {
    return results;
  }

  try {
    // Use the new batch sync endpoint
    const syncResults = await makeAuthenticatedAPIRequest(`${endpoint}sync/`, {
      method: 'POST',
      body: JSON.stringify(batchData),
    });

    // Process sync results and update local records
    for (let i = 0; i < syncResults.length; i++) {
      const syncResult = syncResults[i];
      const localItem = dirtyItems[i];

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
        results.synced++;
      }
    }
  } catch (error) {
    // If batch sync fails, fall back to individual sync
    console.warn(`Batch sync failed for ${endpoint}, falling back to individual sync:`, error.message);
    return await syncLocalToBackendForTableIndividual(config, userId);
  }

  return results;
}

// Fallback function for individual sync (original implementation)
export async function syncLocalToBackendForTableIndividual(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformToBackend, dependencies } = config;

  // CRITICAL: Filter by userId to prevent syncing other users' data
  const dirtyItems = await db.select().from(table).where(and(
    eq(table.isDirty, true),
    eq(table.userId, userId)
  ));
  
  const results = { synced: 0, failed: 0, errors: [] };

  for (const item of dirtyItems) {
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

      const backendData = transformToBackend(item);

      if (item.isDeleted) {
        if (item.backendId) {
          await makeAuthenticatedAPIRequest(`${endpoint}${item.backendId}/`, { method: 'DELETE' });
        }
      } else if (item.backendId) {
        await makeAuthenticatedAPIRequest(`${endpoint}${item.backendId}/`, {
          method: 'PUT',
          body: JSON.stringify(backendData),
        });
        await db.update(table).set({ isDirty: false, lastSynced: new Date().toISOString() }).where(eq(table.id, item.id));
      } else {
        const created = await makeAuthenticatedAPIRequest(endpoint, {
          method: 'POST',
          body: JSON.stringify(backendData),
        });
        await db.update(table).set({ backendId: created.id, isDirty: false, lastSynced: new Date().toISOString() }).where(eq(table.id, item.id));
      }
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push({ item: item.id, error: error.message });
    }
  }
  return results;
}

// Sync backend data to local table
export async function syncBackendToLocalForTable(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformFromBackend, dependencies } = config;

  console.log(`Syncing ${endpoint} for user ${userId}...`);
  const backendItems = await makeAuthenticatedAPIRequest(endpoint);
  
  // CRITICAL DEBUG: Log what the backend is returning
  console.log(`Backend returned ${backendItems.length} items from ${endpoint}:`, 
    backendItems.map(item => ({ id: item.id, user: item.user || item.user_id || 'NO_USER_FIELD' })));
  
  // CRITICAL: Filter local items by userId to prevent data mixing
  const localItems = await db.select().from(table).where(eq(table.userId, userId));
  const localByBackendId = new Map(localItems.map(item => [item.backendId, item]));

  const results = { synced: 0, failed: 0, errors: [] };

  for (const backendItem of backendItems) {
    try {
        // CRITICAL SECURITY CHECK: Verify this data belongs to the current user
        // Check if backend item has user field that matches current user
        const backendUserId = backendItem.user || backendItem.user_id || backendItem.userId;
        if (backendUserId && backendUserId !== userId) {
            console.warn(`SECURITY WARNING: Backend returned data for user ${backendUserId} but current user is ${userId}. Skipping.`);
            continue; // Skip this item
        }
        
        // Resolve dependencies: get local IDs for foreign keys
        if (dependencies) {
            for (const [localKey, dependencyTable] of Object.entries(dependencies)) {
                const backendId = backendItem[localKey.replace('Id', '')];
                const localId = await getLocalIdFromBackendId(syncConfig[dependencyTable].table, backendId);
                if (!localId) {
                    throw new Error(`Dependency not met: ${dependencyTable} with backend ID ${backendId} not found locally.`);
                }
                backendItem[localKey] = localId;
            }
        }

      const localData = transformFromBackend(backendItem, userId);
      const existing = localByBackendId.get(backendItem.id);

      if (existing) {
        // Only update if backend data is newer (not implemented, simple overwrite)
        await db.update(table).set(localData).where(eq(table.id, existing.id));
      } else {
        await db.insert(table).values(localData);
      }
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push({ item: backendItem.id, error: error.message });
    }
  }
  return results;
}
