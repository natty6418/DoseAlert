// Database queries using Drizzle ORM with updated schema
import { db, medications, schedules, reminders, adherenceRecords, adherenceStreaks } from '../services/database.js';
import { eq, and, desc, isNull, or } from 'drizzle-orm';

// Medication CRUD operations

// Create a new medication
export const createMedication = async (medicationData) => {
  try {
    const result = await db.insert(medications).values({
      backendId: medicationData.backendId || null,
      userId: medicationData.userId,
      name: medicationData.name,
      directions: medicationData.directions,
      sideEffects: medicationData.sideEffects,
      purpose: medicationData.purpose,
      warnings: medicationData.warnings,
      dosageAmount: medicationData.dosageAmount,
      dosageUnit: medicationData.dosageUnit,
      notes: medicationData.notes,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate,
      frequency: medicationData.frequency,
      isDirty: true // Mark as needing sync
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Error creating medication:', error);
    throw error;
  }
};

// Get medications for a user (excluding soft-deleted)
export const getMedicationsByUserId = async (userId) => {
  try {
    const userMedications = await db
      .select()
      .from(medications)
      .where(and(
        eq(medications.userId, userId),
        or(eq(medications.isDeleted, false), isNull(medications.isDeleted))
      ))
      .orderBy(desc(medications.createdAt));
    return userMedications;
  } catch (error) {
    console.error('Error getting medications by user ID:', error);
    throw error;
  }
};

// Update medication
export const updateMedication = async (medicationId, medicationData) => {
  try {
    const result = await db
      .update(medications)
      .set({
        ...medicationData,
        updatedAt: new Date().toISOString(),
        isDirty: true // Mark as needing sync
      })
      .where(eq(medications.id, medicationId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating medication:', error);
    throw error;
  }
};

// Soft delete medication
export const deleteMedication = async (medicationId) => {
  try {
    const result = await db
      .update(medications)
      .set({
        isDeleted: true,
        updatedAt: new Date().toISOString(),
        isDirty: true // Mark as needing sync
      })
      .where(eq(medications.id, medicationId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw error;
  }
};

// Get medications that need syncing
export const getDirtyMedications = async (userId) => {
  try {
    const dirtyMeds = await db
      .select()
      .from(medications)
      .where(and(
        eq(medications.userId, userId),
        eq(medications.isDirty, true)
      ));
    return dirtyMeds;
  } catch (error) {
    console.error('Error getting dirty medications:', error);
    throw error;
  }
};

// Mark medication as synced
export const markMedicationSynced = async (medicationId, backendId = null) => {
  try {
    const updateData = {
      isDirty: false,
      lastSynced: new Date().toISOString()
    };
    if (backendId) {
      updateData.backendId = backendId;
    }
    
    const result = await db
      .update(medications)
      .set(updateData)
      .where(eq(medications.id, medicationId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error marking medication as synced:', error);
    throw error;
  }
};

// Schedule CRUD operations

// Create a schedule
export const createSchedule = async (scheduleData) => {
  try {
    const result = await db.insert(schedules).values({
      backendId: scheduleData.backendId || null,
      medicationId: scheduleData.medicationId,
      timeOfDay: scheduleData.timeOfDay,
      daysOfWeek: scheduleData.daysOfWeek,
      timezone: scheduleData.timezone || 'UTC',
      active: scheduleData.active !== false,
      isDirty: true
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

// Get schedules for a medication
export const getSchedulesByMedicationId = async (medicationId) => {
  try {
    const medicationSchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.medicationId, medicationId),
        eq(schedules.active, true),
        or(eq(schedules.isDeleted, false), isNull(schedules.isDeleted))
      ));
    return medicationSchedules;
  } catch (error) {
    console.error('Error getting schedules by medication ID:', error);
    throw error;
  }
};

// Reminder CRUD operations

// Create a reminder
export const createReminder = async (reminderData) => {
  try {
    const result = await db.insert(reminders).values({
      backendId: reminderData.backendId || null,
      scheduleId: reminderData.scheduleId,
      medicationId: reminderData.medicationId,
      scheduledAt: reminderData.scheduledAt,
      sentAt: reminderData.sentAt,
      status: reminderData.status || 'pending',
      isDirty: true
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw error;
  }
};

// Get pending reminders
export const getPendingReminders = async () => {
  try {
    const pending = await db
      .select()
      .from(reminders)
      .where(eq(reminders.status, 'pending'))
      .orderBy(reminders.scheduledAt);
    return pending;
  } catch (error) {
    console.error('Error getting pending reminders:', error);
    throw error;
  }
};

// Adherence record CRUD operations

// Create adherence record
export const createAdherenceRecord = async (adherenceData) => {
  try {
    const result = await db.insert(adherenceRecords).values({
      backendId: adherenceData.backendId || null,
      medicationId: adherenceData.medicationId,
      reminderId: adherenceData.reminderId,
      status: adherenceData.status,
      scheduledTime: adherenceData.scheduledTime,
      actualTime: adherenceData.actualTime,
      responseTime: adherenceData.responseTime || new Date().toISOString(),
      isLate: adherenceData.isLate || false,
      minutesLate: adherenceData.minutesLate || 0,
      notes: adherenceData.notes,
      isDirty: true
    }).returning();
    return result[0];
  } catch (error) {
    console.error('Error creating adherence record:', error);
    throw error;
  }
};

// Get adherence records for a medication
export const getAdherenceRecordsByMedicationId = async (medicationId) => {
  try {
    const records = await db
      .select()
      .from(adherenceRecords)
      .where(and(
        eq(adherenceRecords.medicationId, medicationId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ))
      .orderBy(desc(adherenceRecords.scheduledTime));
    return records;
  } catch (error) {
    console.error('Error getting adherence records:', error);
    throw error;
  }
};

// Adherence streak operations

// Update adherence streak
export const updateAdherenceStreak = async (medicationId, streakData) => {
  try {
    // First, try to find existing streak
    const existing = await db
      .select()
      .from(adherenceStreaks)
      .where(eq(adherenceStreaks.medicationId, medicationId));
    
    if (existing.length > 0) {
      // Update existing streak
      const result = await db
        .update(adherenceStreaks)
        .set({
          ...streakData,
          updatedAt: new Date().toISOString(),
          isDirty: true
        })
        .where(eq(adherenceStreaks.medicationId, medicationId))
        .returning();
      return result[0];
    } else {
      // Create new streak
      const result = await db.insert(adherenceStreaks).values({
        medicationId,
        ...streakData,
        isDirty: true
      }).returning();
      return result[0];
    }
  } catch (error) {
    console.error('Error updating adherence streak:', error);
    throw error;
  }
};

// Get adherence streak for medication
export const getAdherenceStreakByMedicationId = async (medicationId) => {
  try {
    const streak = await db
      .select()
      .from(adherenceStreaks)
      .where(eq(adherenceStreaks.medicationId, medicationId));
    return streak[0];
  } catch (error) {
    console.error('Error getting adherence streak:', error);
    throw error;
  }
};

// Sync utility functions

// Get all dirty records that need syncing
export const getAllDirtyRecords = async (userId) => {
  try {
    const dirtyMeds = await getDirtyMedications(userId);
    
    const dirtySchedules = await db
      .select()
      .from(schedules)
      .innerJoin(medications, eq(schedules.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(schedules.isDirty, true)
      ));
    
    const dirtyReminders = await db
      .select()
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(reminders.isDirty, true)
      ));
    
    const dirtyAdherence = await db
      .select()
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceRecords.isDirty, true)
      ));
    
    const dirtyStreaks = await db
      .select()
      .from(adherenceStreaks)
      .innerJoin(medications, eq(adherenceStreaks.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceStreaks.isDirty, true)
      ));
    
    return {
      medications: dirtyMeds,
      schedules: dirtySchedules,
      reminders: dirtyReminders,
      adherenceRecords: dirtyAdherence,
      adherenceStreaks: dirtyStreaks
    };
  } catch (error) {
    console.error('Error getting dirty records:', error);
    throw error;
  }
};
