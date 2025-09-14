// GuestMigration.js
// Handles migrating guest user data when they authenticate

import { getDatabase } from './database.js';
import { medications, schedules, adherenceRecords, adherenceStreaks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const GUEST_USER_ID = 1; // As defined in your schema comment

/**
 * Migrate all guest user data to the authenticated user
 * Should be called immediately after successful login/registration
 */
export async function migrateGuestDataToUser(newUserId) {
  const db = getDatabase();
  let migratedData = {
    medications: 0,
    schedules: 0,
    adherenceRecords: 0,
    adherenceStreaks: 0,
    errors: []
  };
  
  console.log(`Starting migration from guest (ID: ${GUEST_USER_ID}) to user (ID: ${newUserId})...`);
  
  try {
    // Start a transaction for data integrity
    await db.transaction(async (tx) => {
      
      // 1. Migrate medications
      const guestMedications = await tx.select()
        .from(medications)
        .where(eq(medications.userId, GUEST_USER_ID));
      
      console.log(`Found ${guestMedications.length} guest medications to migrate`);
      
      for (const med of guestMedications) {
        await tx.update(medications)
          .set({ 
            userId: newUserId,
            isDirty: true, // Mark for sync to backend
            lastSynced: null, // Reset sync status
            backendId: null // Will get new backend ID when synced
          })
          .where(eq(medications.id, med.id));
        
        migratedData.medications++;
        console.log(`Migrated medication: "${med.name}"`);
      }
      
      // 2. Migrate schedules (these don't have userId but are linked to medications)
      const medicationIds = guestMedications.map(med => med.id);
      
      if (medicationIds.length > 0) {
        // Update schedules to mark as dirty for sync
        for (const medId of medicationIds) {
          const scheduleResults = await tx.update(schedules)
            .set({ 
              isDirty: true,
              lastSynced: null,
              backendId: null
            })
            .where(eq(schedules.medicationId, medId))
            .returning();
          
          migratedData.schedules += scheduleResults.length;
          console.log(`Migrated ${scheduleResults.length} schedules for medication ID ${medId}`);
        }
      }
      
      // 3. Migrate adherence records (linked to medications)
      if (medicationIds.length > 0) {
        for (const medId of medicationIds) {
          const adherenceResults = await tx.update(adherenceRecords)
            .set({ 
              isDirty: true,
              lastSynced: null,
              backendId: null
            })
            .where(eq(adherenceRecords.medicationId, medId))
            .returning();
          
          migratedData.adherenceRecords += adherenceResults.length;
        }
      }
      
      // 4. Migrate adherence streaks (linked to medications)
      if (medicationIds.length > 0) {
        for (const medId of medicationIds) {
          const streakResults = await tx.update(adherenceStreaks)
            .set({ 
              isDirty: true,
              lastSynced: null,
              backendId: null
            })
            .where(eq(adherenceStreaks.medicationId, medId))
            .returning();
          
          migratedData.adherenceStreaks += streakResults.length;
        }
      }
      
    });
    
    console.log('✅ Guest data migration completed successfully!');
    console.log(`Migrated: ${migratedData.medications} medications, ${migratedData.schedules} schedules, ${migratedData.adherenceRecords} adherence records, ${migratedData.adherenceStreaks} streaks`);
    
    return migratedData;
    
  } catch (error) {
    console.error('❌ Error migrating guest data:', error);
    migratedData.errors.push(error.message);
    throw new Error(`Failed to migrate guest data: ${error.message}`);
  }
}

/**
 * Check if there's guest data that needs migration
 */
export async function hasGuestDataToMigrate() {
  try {
    const db = getDatabase();
    
    const guestMedications = await db.select()
      .from(medications)
      .where(eq(medications.userId, GUEST_USER_ID));
    
    return {
      hasData: guestMedications.length > 0,
      medicationCount: guestMedications.length,
      medications: guestMedications.map(med => ({
        id: med.id,
        name: med.name,
        createdAt: med.createdAt
      }))
    };
    
  } catch (error) {
    console.error('Error checking for guest data:', error);
    return { hasData: false, medicationCount: 0, medications: [] };
  }
}

/**
 * Clean up any remaining guest data (call after successful migration and sync)
 */
export async function cleanupRemainingGuestData() {
  try {
    const db = getDatabase();
    
    // Double-check there's no unsyced guest data before cleanup
    const unsynced = await db.select()
      .from(medications)
      .where(and(
        eq(medications.userId, GUEST_USER_ID),
        eq(medications.isDirty, true)
      ));
    
    if (unsynced.length > 0) {
      console.warn(`⚠️ Found ${unsynced.length} unsynced guest medications. Skipping cleanup.`);
      return { cleaned: 0, skipped: unsynced.length };
    }
    
    // Safe to clean up synced guest data
    const deleted = await db.delete(medications)
      .where(and(
        eq(medications.userId, GUEST_USER_ID),
        eq(medications.isDirty, false)
      ))
      .returning();
    
    console.log(`🧹 Cleaned up ${deleted.length} old guest medications`);
    return { cleaned: deleted.length, skipped: 0 };
    
  } catch (error) {
    console.error('Error cleaning up guest data:', error);
    throw error;
  }
}
