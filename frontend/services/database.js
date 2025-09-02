import * as SQLite from 'expo-sqlite'
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations.js';
// Schema imports will be used when we implement CRUD operations with Drizzle
// import { users, medications, reminders, adherenceLogs } from '../db/schema.js';


let db = null;

// Initialize SQLite database
const initDatabase = async () => {
  try {
    if (db) return db;

    // Open SQLite database
    const expo = await SQLite.openDatabaseAsync('dosealert.db');
    db = drizzle(expo);
    
    // Run migrations instead of creating tables manually
    await migrate(db, migrations);

    console.log('SQLite database initialized and migrated successfully');
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
export { users, medications, reminders, adherenceLogs } from '../db/schema.js';

export {
  setupDatabase,
  db,
};
