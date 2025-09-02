// ReminderHandler.js
// Handles reminder-related operations using Drizzle ORM

import { getDatabase, isDatabaseInitialized, setupDatabase, reminders, medications } from './database.js';
import { eq, and, desc } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  if (!isDatabaseInitialized()) {
    await setupDatabase();
  }
  return getDatabase();
};

// Get all reminders for authenticated user
export async function getReminders(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const reminderResults = await db
      .select({
        id: reminders.id,
        medicationId: reminders.medicationId,
        time: reminders.time,
        isActive: reminders.isActive,
        createdAt: reminders.createdAt,
        updatedAt: reminders.updatedAt,
        medicationName: medications.name
      })
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(desc(reminders.createdAt));
    
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
        medicationId: reminders.medicationId,
        time: reminders.time,
        isActive: reminders.isActive,
        createdAt: reminders.createdAt,
        updatedAt: reminders.updatedAt,
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
