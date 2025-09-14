// ReminderHandler.js
// Handles reminder-related operations using Drizzle ORM with new schema

import { getDatabase, isDatabaseInitialized, setupDatabase, reminders, medications  } from './database.js';
import { eq, and, desc, lt } from 'drizzle-orm';

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

// Cleanup old reminders
export async function cleanupOldReminders(userId, days = 30) {
  try {
    const db = await ensureDbInitialized();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateString = cutoffDate.toISOString();

    // Find old reminders to be deleted
    const oldReminders = await db.select({ id: reminders.id })
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        lt(reminders.scheduledAt, cutoffDateString)
      ));

    if (oldReminders.length === 0) {
      console.log('No old reminders to clean up.');
      return 0;
    }

    const reminderIds = oldReminders.map(r => r.id);

    // Delete old reminders
    await db.delete(reminders)
      .where(inArray(reminders.id, reminderIds));

    console.log(`Cleaned up ${reminderIds.length} old reminders.`);
    return reminderIds.length;
  } catch (error) {
    console.error('Error cleaning up old reminders:', error);
    throw new Error(`Failed to clean up old reminders: ${error.message}`);
  }
}
