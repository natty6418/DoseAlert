// dbUtils.js
// Database utility functions for sync operations

import { getDatabase, medications } from '../database.js';
import { eq, and, inArray } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { syncConfig } from './syncConfig.js';

// Get local ID from backend ID
export async function getLocalIdFromBackendId(table, backendId) {
  if (!backendId) return null;
  const db = getDatabase();
  const result = await db.select({ id: table.id }).from(table).where(eq(table.backendId, backendId)).limit(1);
  return result[0]?.id;
}

// Get backend ID from local ID
export async function getBackendIdFromLocalId(table, localId) {
  if (!localId) return null;
  const db = getDatabase();
  const result = await db.select({ backendId: table.backendId }).from(table).where(eq(table.id, localId)).limit(1);
  return result[0]?.backendId;
}

// Get dirty items for a user and table
export async function getDirtyItems(table, userId) {
  const db = getDatabase();
  
  // If table has a userId column, filter directly
  if (table.userId) {
    return await db.select().from(table).where(and(
      eq(table.isDirty, true),
      eq(table.userId, userId)
    ));
  } 
  // Otherwise, join with medications table to filter by user
  else if (table.medicationId) {
    const results = await db.select().from(table)
      .leftJoin(medications, eq(table.medicationId, medications.id))
      .where(and(
        eq(table.isDirty, true),
        eq(medications.userId, userId)
      ));
    // Drizzle returns nested objects on joins, so we extract the part we need
    const tableName = getTableConfig(table).name;
    return results.map(row => row[tableName]);
  }
  
  console.warn(`Cannot get dirty items for table ${getTableConfig(table).name} as it cannot be filtered by user.`);
  return [];
}

// Cleanup deleted records that have been synced
export async function cleanupDeletedRecords(userId) {
  const db = getDatabase();
  let cleanedCount = 0;
  
  for (const key in syncConfig) {
    const { table } = syncConfig[key];
    let itemsToDelete;

    const baseConditions = [
        eq(table.isDeleted, true),
        eq(table.isDirty, false)
    ];

    if (table.userId) {
        itemsToDelete = await db.select({id: table.id}).from(table).where(and(
            ...baseConditions,
            eq(table.userId, userId)
        ));
    }
    else if (table.medicationId) {
        const results = await db.select({id: table.id}).from(table)
            .leftJoin(medications, eq(table.medicationId, medications.id))
            .where(and(
                ...baseConditions,
                eq(medications.userId, userId)
            ));
        itemsToDelete = results;
    } else {
        console.warn(`Cannot cleanup records for table ${getTableConfig(table).name} as it cannot be filtered by user.`);
        continue;
    }
    
    if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id);
        await db.delete(table).where(inArray(table.id, idsToDelete));
        cleanedCount += idsToDelete.length;
    }
  }
  
  console.log(`Permanently deleted ${cleanedCount} records.`);
  return { cleanedCount };
}
