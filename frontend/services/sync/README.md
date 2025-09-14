# Sync Module

A modular sync service for DoseAlert that handles synchronization between local SQLite database and backend API.

## Architecture

The sync module is broken down into focused, single-responsibility modules:

### Core Modules

- **`index.js`** - Main entry point, exports all functionality
- **`syncConfig.js`** - Configuration and data transformation functions
- **`mainSync.js`** - Main sync orchestration (fullSync, incrementalSync)
- **`batchSync.js`** - Batch sync functionality for efficient uploads
- **`individualSync.js`** - Individual sync operations (fallback)
- **`apiUtils.js`** - API helper functions and authentication
- **`dbUtils.js`** - Database utility functions
- **`utils.js`** - General utility functions

## Usage

```javascript
import { fullSync, incrementalSync, batchUploadSync } from './services/sync';

// Full bidirectional sync
const results = await fullSync(userId);

// Incremental sync (uploads + conditional downloads)
const results = await incrementalSync(userId);

// Batch upload only
const results = await batchUploadSync(userId);
```

## Batch Sync Endpoints

The service uses these new batch sync endpoints for efficient uploads:

- `POST /api/meds/sync/`
- `POST /api/schedules/sync/`
- `POST /api/adherence/sync/`

## Features

- **Efficient Batch Uploads**: Multiple changes in single HTTP requests
- **Automatic Fallback**: Falls back to individual API calls if batch sync fails
- **Dependency Management**: Respects table dependencies (medications → schedules → adherence)
- **Security**: User isolation and data validation
- **Error Handling**: Comprehensive error handling and reporting
- **Cleanup**: Automatic cleanup of deleted records

## Migration from SyncService.js

The new modular structure maintains the same API as the original `SyncService.js`:

```javascript
// Old import
import { fullSync } from './services/SyncService.js';

// New import
import { fullSync } from './services/sync';

// Usage remains the same
const results = await fullSync(userId);
```
