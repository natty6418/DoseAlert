// PostAuthMigration.js
// Handles post-authentication tasks like syncing migrated data

import { fullSync } from './sync/index.js';
import { cleanupRemainingGuestData } from './GuestMigration.js';

/**
 * Complete post-authentication workflow:
 * 1. Sync migrated guest data to backend
 * 2. Download any existing user data from backend
 * 3. Clean up old guest data after successful sync
 */
export async function completePostAuthMigration(userId) {
  console.log('🔄 Starting post-authentication migration workflow...');
  
  try {
    // Step 1: Full sync to ensure all migrated data gets to backend
    console.log('📤 Syncing migrated data to backend...');
    const syncResults = await fullSync(userId);
    
    console.log('✅ Sync completed:', syncResults);
    
    // Step 2: Check if sync was successful (no failed uploads)
    const hasFailedUploads = Object.values(syncResults)
      .filter(key => key.includes('_upload'))
      .some(result => result.failed > 0);
    
    if (hasFailedUploads) {
      console.warn('⚠️ Some data failed to sync to backend. Keeping guest data for retry.');
      return {
        success: true,
        syncResults,
        guestDataCleaned: false,
        warning: 'Some guest data could not be synced to backend'
      };
    }
    
    // Step 3: Clean up guest data after successful sync
    console.log('🧹 Cleaning up old guest data...');
    const cleanupResult = await cleanupRemainingGuestData();
    
    console.log('🎉 Post-authentication migration completed successfully!');
    
    return {
      success: true,
      syncResults,
      guestDataCleaned: true,
      cleanupResult
    };
    
  } catch (error) {
    console.error('❌ Error in post-authentication migration:', error);
    return {
      success: false,
      error: error.message,
      syncResults: null,
      guestDataCleaned: false
    };
  }
}

/**
 * Background task to retry sync if initial migration failed
 */
export async function retryFailedGuestDataSync(userId) {
  try {
    console.log('🔄 Retrying failed guest data sync...');
    
    const syncResults = await fullSync(userId);
    
    // Check if all uploads succeeded this time
    const hasFailedUploads = Object.values(syncResults)
      .filter(key => key.includes('_upload'))
      .some(result => result.failed > 0);
    
    if (!hasFailedUploads) {
      console.log('✅ Retry successful! Cleaning up guest data...');
      await cleanupRemainingGuestData();
      return { success: true, syncResults };
    } else {
      console.log('⚠️ Some data still failed to sync. Will retry later.');
      return { success: false, syncResults };
    }
    
  } catch (error) {
    console.error('❌ Error retrying guest data sync:', error);
    return { success: false, error: error.message };
  }
}
