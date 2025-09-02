import * as SQLite from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations.js';
// Schema imports for Drizzle ORM operations



let db = null;
let initPromise = null; // Track initialization promise to prevent concurrent initialization

// Initialize SQLite database
const initDatabase = async () => {
  try {
    // If database is already initialized, return it
    if (db) return db;

    // If initialization is in progress, wait for it
    if (initPromise) {
      await initPromise;
      return db;
    }

    // Start initialization
    initPromise = (async () => {
      try {
        // Open SQLite database
        const expo = await SQLite.openDatabaseAsync('dosealert.db');
        db = drizzle(expo);
        
        // Run migrations instead of creating tables manually
        await migrate(db, migrations);

        console.log('SQLite database initialized and migrated successfully');
        return db;
      } catch (error) {
        // Reset on error so we can retry
        db = null;
        initPromise = null;
        throw error;
      }
    })();

    await initPromise;
    initPromise = null; // Clear promise after successful initialization
    return db;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
};

const setupDatabase = async () => {
  try {
    await initDatabase();
    console.log('SQLite database setup completed');
  } catch (error) {
    console.error('Error setting up SQLite database:', error);
    throw error;
  }
};



// Get the database instance
export const getDatabase = () => db;

// Check if database is initialized
export const isDatabaseInitialized = () => !!db;

// Export schema tables for use with Drizzle queries
export { 
  medications, 
  schedules, 
  reminders, 
  adherenceRecords, 
  adherenceStreaks 
} from '../db/schema.js';

export {
  setupDatabase,
  db,
};
