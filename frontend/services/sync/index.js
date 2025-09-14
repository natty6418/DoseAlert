// index.js
// Main entry point for sync services
// 
// Modular sync service with batch sync endpoints for efficient uploads:
// - POST /api/meds/sync/
// - POST /api/schedules/sync/ 
// - POST /api/adherence/sync/
// 
// The service uses batch sync for uploading local changes and traditional
// GET endpoints for downloading server data. Falls back to individual
// API calls if batch sync fails or is unavailable.

// Main sync functions
export { fullSync, incrementalSync } from './mainSync.js';

// Batch sync functions
export { batchUploadSync } from './batchSync.js';

// Individual sync functions (fallback)
export { 
  syncLocalToBackendForTable, 
  syncBackendToLocalForTable,
  syncLocalToBackendForTableIndividual 
} from './individualSync.js';

// Utility functions
export { 
  getLastSyncTime, 
  isSyncNeeded, 
  setLastSyncTime 
} from './utils.js';

// Database utilities
export { 
  cleanupDeletedRecords,
  getLocalIdFromBackendId,
  getBackendIdFromLocalId,
  getDirtyItems
} from './dbUtils.js';

// API utilities
export { 
  makeAuthenticatedAPIRequest, 
  isBatchSyncAvailable 
} from './apiUtils.js';

// Configuration
export { syncConfig } from './syncConfig.js';

// Convenience functions
export async function forceBatchSync(userId) {
  const { batchUploadSync } = await import('./batchSync.js');
  return await batchUploadSync(userId);
}

// Legacy compatibility - these functions maintain the same interface as the original SyncService
export { fullSync as default } from './mainSync.js';
