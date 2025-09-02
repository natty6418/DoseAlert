// Example usage of Drizzle ORM with the schema
import { db, users, medications, reminders, adherenceLogs } from './database.js';
import { eq, and, desc } from 'drizzle-orm';

// Example CRUD operations using Drizzle ORM

// Create a new user
export const createUser = async (userData) => {
  try {
    const result = await db.insert(users).values(userData);
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  try {
    const user = await db.select().from(users).where(eq(users.email, email));
    return user[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Create a new medication
export const createMedication = async (medicationData) => {
  try {
    const result = await db.insert(medications).values({
      userId: medicationData.userId,
      name: medicationData.name,
      directions: medicationData.directions,
      sideEffects: Array.isArray(medicationData.side_effects) 
        ? JSON.stringify(medicationData.side_effects) 
        : medicationData.side_effects,
      purpose: medicationData.purpose,
      warnings: medicationData.warnings,
      dosageAmount: medicationData.dosage_amount,
      dosageUnit: medicationData.dosage_unit,
      notes: medicationData.notes,
      startDate: medicationData.start_date,
      endDate: medicationData.end_date,
      frequency: medicationData.frequency
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Error creating medication:', error);
    throw error;
  }
};

// Get medications for a user
export const getMedicationsByUserId = async (userId) => {
  try {
    const userMedications = await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.createdAt));
    return userMedications;
  } catch (error) {
    console.error('Error getting medications by user ID:', error);
    throw error;
  }
};

// Create a reminder
export const createReminder = async (reminderData) => {
  try {
    const result = await db.insert(reminders).values(reminderData);
    return result;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Get active reminders for a medication
export const getActiveRemindersByMedicationId = async (medicationId) => {
  try {
    const activeReminders = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.medicationId, medicationId), eq(reminders.isActive, true)));
    return activeReminders;
  } catch (error) {
    console.error('Error getting active reminders:', error);
    throw error;
  }
};

// Log medication adherence
export const logAdherence = async (adherenceData) => {
  try {
    const result = await db.insert(adherenceLogs).values(adherenceData);
    return result;
  } catch (error) {
    console.error('Error logging adherence:', error);
    throw error;
  }
};

// Get adherence logs for a medication
export const getAdherenceLogsByMedicationId = async (medicationId) => {
  try {
    const logs = await db
      .select()
      .from(adherenceLogs)
      .where(eq(adherenceLogs.medicationId, medicationId))
      .orderBy(desc(adherenceLogs.takenAt));
    return logs;
  } catch (error) {
    console.error('Error getting adherence logs:', error);
    throw error;
  }
};
