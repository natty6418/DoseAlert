// ReminderHandler.js
// Handles reminder-related operations using Drizzle ORM with new schema

import { getDatabase, isDatabaseInitialized, setupDatabase, reminders, medications  } from './database.js';
import { eq, and, desc } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      if (!isDatabaseInitialized()) {
        await setupDatabase();
      }
      return getDatabase();
    } catch (error) {
      retryCount++;
      console.error(`Database initialization error (attempt ${retryCount}):`, error);
      
      if (retryCount < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
      } else {
        throw error;
      }
    }
  }
};

// Get all reminders for authenticated user
export async function getReminders(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const reminderResults = await db
      .select({
        id: reminders.id,
        backendId: reminders.backendId,
        scheduleId: reminders.scheduleId,
        medicationId: reminders.medicationId,
        scheduledAt: reminders.scheduledAt,
        sentAt: reminders.sentAt,
        status: reminders.status,
        createdAt: reminders.createdAt,
        medicationName: medications.name
      })
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(desc(reminders.scheduledAt));
    
    return reminderResults;
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw new Error(`Failed to get reminders: ${error.message}`);
  }
}

// Get a specific reminder
export async function getReminder(userId, reminderId) {
  try {
    const db = await ensureDbInitialized();
    
    const reminderResults = await db
      .select({
        id: reminders.id,
        backendId: reminders.backendId,
        scheduleId: reminders.scheduleId,
        medicationId: reminders.medicationId,
        scheduledAt: reminders.scheduledAt,
        sentAt: reminders.sentAt,
        status: reminders.status,
        createdAt: reminders.createdAt,
        medicationName: medications.name
      })
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(and(eq(reminders.id, reminderId), eq(medications.userId, userId)));
    
    if (!reminderResults || reminderResults.length === 0) {
      throw new Error('Reminder not found');
    }
    
    return reminderResults[0];
  } catch (error) {
    console.error('Error getting reminder:', error);
    throw new Error(`Failed to get reminder: ${error.message}`);
  }
}
