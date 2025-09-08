// SyncService.js
// Handles syncing all user data between local SQLite and backend API

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from './UserHandler.js';
import { getDatabase } from './database.js';
import { medications, schedules, adherenceRecords, adherenceStreaks } from '../db/schema.js';
import { eq, and, or, isNull } from 'drizzle-orm';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

// API helper function with authentication
const makeAuthenticatedAPIRequest = async (endpoint, options = {}) => {
  const accessToken = await getStoredAccessToken();
  if (!accessToken) throw new Error('No access token available');

  const url = `${BACKEND_URL}/api${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(errorData.detail || errorData.message || 'API request failed');
  }

  return response.json();
};

// ====== Data Transformation Functions ======

const transformMedicationToBackend = (local) => ({
  name: local.name,
  directions: local.directions,
  side_effects: local.sideEffects,
  purpose: local.purpose,
  warnings: local.warnings,
  dosage_amount: local.dosageAmount,
  dosage_unit: local.dosageUnit,
  notes: local.notes,
  start_date: local.startDate,
  end_date: local.endDate,
  frequency: local.frequency,
});

const transformScheduleToBackend = (local) => ({
    medication: local.medicationBackendId, // Requires medication to be synced first
    time_of_day: local.timeOfDay,
    days_of_week: local.daysOfWeek,
    timezone: local.timezone,
    active: local.active,
    reminder_enabled: local.reminderEnabled,
});

const transformAdherenceToBackend = (local) => ({
    medication: local.medicationBackendId,
    reminder: local.reminderBackendId,
    status: local.status,
    scheduled_time: local.scheduledTime,
    actual_time: local.actualTime,
    notes: local.notes,
});


const genericTransformFromBackend = (backend, userId, extraFields = {}) => ({
  backendId: backend.id,
  userId,
  ...extraFields,
  isDirty: false,
  lastSynced: new Date().toISOString(),
});

// ====== Generic Sync Framework ======

const syncConfig = {
  medications: {
    table: medications,
    endpoint: '/meds/',
    transformToBackend: transformMedicationToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
      name: backend.name,
      directions: backend.directions,
      sideEffects: backend.side_effects,
      purpose: backend.purpose,
      warnings: backend.warnings,
      dosageAmount: backend.dosage_amount,
      dosageUnit: backend.dosage_unit,
      notes: backend.notes,
      startDate: backend.start_date,
      endDate: backend.end_date,
      frequency: backend.frequency,
    }),
  },
  schedules: {
    table: schedules,
    endpoint: '/schedules/',
    dependencies: { medicationId: 'medications' },
    transformToBackend: transformScheduleToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
        medicationId: backend.medication, // This needs to be converted to local ID
        timeOfDay: backend.time_of_day,
        daysOfWeek: backend.days_of_week,
        timezone: backend.timezone,
        active: backend.active,
        reminderEnabled: backend.reminder_enabled,
    }),
  },
  adherenceRecords: {
    table: adherenceRecords,
    endpoint: '/adherence/records/',
    dependencies: { medicationId: 'medications', reminderId: 'reminders' },
    transformToBackend: transformAdherenceToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
        medicationId: backend.medication, // Convert to local ID
        reminderId: backend.reminder, // Convert to local ID
        status: backend.status,
        scheduledTime: backend.scheduled_time,
        actualTime: backend.actual_time,
        isLate: backend.is_late,
        minutesLate: backend.minutes_late,
        notes: backend.notes,
    }),
  },
};

async function getLocalIdFromBackendId(table, backendId) {
    if (!backendId) return null;
    const db = getDatabase();
    const result = await db.select({ id: table.id }).from(table).where(eq(table.backendId, backendId)).limit(1);
    return result[0]?.id;
}

async function getBackendIdFromLocalId(table, localId) {
    if (!localId) return null;
    const db = getDatabase();
    const result = await db.select({ backendId: table.backendId }).from(table).where(eq(table.id, localId)).limit(1);
    return result[0]?.backendId;
}


// Generic function to sync a local table to the backend
async function syncLocalToBackendForTable(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformToBackend, dependencies } = config;

  const dirtyItems = await db.select().from(table).where(and(eq(table.isDirty, true)));
  
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
        const updated = await makeAuthenticatedAPIRequest(`${endpoint}${item.backendId}/`, {
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

// Generic function to sync a backend table to local
async function syncBackendToLocalForTable(config, userId) {
  const db = getDatabase();
  const { table, endpoint, transformFromBackend, dependencies } = config;

  const backendItems = await makeAuthenticatedAPIRequest(endpoint);
  const localItems = await db.select().from(table);
  const localByBackendId = new Map(localItems.map(item => [item.backendId, item]));

  const results = { synced: 0, failed: 0, errors: [] };

  for (const backendItem of backendItems) {
    try {
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


// ====== Main Sync Functions ======

export async function fullSync(userId) {
  console.log('Starting full bidirectional sync...');
  const results = {};

  // Sync medications first as other tables depend on it
  const medConfig = syncConfig.medications;
  results.medications_upload = await syncLocalToBackendForTable(medConfig, userId);
  results.medications_download = await syncBackendToLocalForTable(medConfig, userId);

  // Sync other tables
  for (const key in syncConfig) {
    if (key === 'medications') continue;
    const config = syncConfig[key];
    results[`${key}_upload`] = await syncLocalToBackendForTable(config, userId);
    results[`${key}_download`] = await syncBackendToLocalForTable(config, userId);
  }

  await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
  console.log('Full sync completed.');
  return results;
}

export async function incrementalSync(userId) {
    console.log('Starting incremental sync...');
    const results = {};
  
    // Upload changes for all tables, respecting dependencies
    for (const key in syncConfig) {
        results[`${key}_upload`] = await syncLocalToBackendForTable(syncConfig[key], userId);
    }
  
    // Download all data from backend for now.
    // A true incremental download would require the backend to support a `since` timestamp.
    if (await isSyncNeeded(1)) { // Sync if more than 1 hour
        for (const key in syncConfig) {
            results[`${key}_download`] = await syncBackendToLocalForTable(syncConfig[key], userId);
        }
    }
  
    await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
    console.log('Incremental sync completed.');
    return results;
}


// ====== Utility Functions ======

export async function getLastSyncTime() {
  return AsyncStorage.getItem('lastSyncTime');
}

export async function isSyncNeeded(hoursThreshold = 24) {
  const lastSync = await getLastSyncTime();
  if (!lastSync) return true;
  const hoursSinceSync = (new Date() - new Date(lastSync)) / (1000 * 60 * 60);
  return hoursSinceSync >= hoursThreshold;
}

export async function cleanupDeletedRecords() {
    const db = getDatabase();
    let cleanedCount = 0;
    for (const key in syncConfig) {
        const { table } = syncConfig[key];
        const deletedAndSynced = await db.select().from(table).where(and(eq(table.isDeleted, true), eq(table.isDirty, false)));
        for (const item of deletedAndSynced) {
            await db.delete(table).where(eq(table.id, item.id));
            cleanedCount++;
        }
    }
    console.log(`Permanently deleted ${cleanedCount} records.`);
    return { cleanedCount };
}
''
