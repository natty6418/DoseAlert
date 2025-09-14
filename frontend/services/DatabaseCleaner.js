// DatabaseCleaner.js
// Utility to clean up potentially corrupted user data

import { getDatabase } from './database.js';
import { medications, schedules, adherenceRecords } from '../db/schema.js';
import { eq, ne } from 'drizzle-orm';

// Clean up medications that don't belong to the current user
export async function cleanupInvalidUserData(currentUserId) {
  const db = getDatabase();
  let cleanedCount = 0;
  
  console.log(`Cleaning up data for user ${currentUserId}...`);
  
  try {
    // Find medications that don't belong to current user
    const invalidMeds = await db.select()
      .from(medications)
      .where(ne(medications.userId, currentUserId));
    
    console.log(`Found ${invalidMeds.length} medications not belonging to current user`);
    
    for (const med of invalidMeds) {
      console.log(`Removing medication: ${med.name} (belongs to user ${med.userId})`);
      
      // Delete associated schedules
      await db.delete(schedules).where(eq(schedules.medicationId, med.id));
      
      // Delete associated adherence records
      await db.delete(adherenceRecords).where(eq(adherenceRecords.medicationId, med.id));
      
      // Delete the medication
      await db.delete(medications).where(eq(medications.id, med.id));
      
      cleanedCount++;
    }
    
    console.log(`Cleaned up ${cleanedCount} invalid medications and their associated data`);
    return { cleanedCount };
    
  } catch (error) {
    console.error('Error cleaning up invalid user data:', error);
    throw error;
  }
}

// Audit function to check for data integrity issues
export async function auditUserData(currentUserId) {
  const db = getDatabase();
  
  try {
    const totalMeds = await db.select().from(medications);
    const userMeds = await db.select().from(medications).where(eq(medications.userId, currentUserId));
    const invalidMeds = await db.select().from(medications).where(ne(medications.userId, currentUserId));
    
    console.log('=== DATA AUDIT RESULTS ===');
    console.log(`Current User ID: ${currentUserId}`);
    console.log(`Total medications in database: ${totalMeds.length}`);
    console.log(`Your medications: ${userMeds.length}`);
    console.log(`Medications belonging to other users: ${invalidMeds.length}`);
    
    if (invalidMeds.length > 0) {
      console.log('Invalid medications found:');
      invalidMeds.forEach(med => {
        console.log(`- "${med.name}" (belongs to user ${med.userId})`);
      });
    }
    
    return {
      totalMeds: totalMeds.length,
      userMeds: userMeds.length,
      invalidMeds: invalidMeds.length,
      details: invalidMeds
    };
    
  } catch (error) {
    console.error('Error auditing user data:', error);
    throw error;
  }
}
