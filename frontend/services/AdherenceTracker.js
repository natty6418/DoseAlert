// AdherenceTracker.js
// Handles medication adherence tracking logic using Drizzle ORM

import { getDatabase, isDatabaseInitialized, setupDatabase, adherenceLogs, medications, reminders } from './database.js';
import { eq, desc, and } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  if (!isDatabaseInitialized()) {
    await setupDatabase();
  }
  return getDatabase();
};

// Record adherence response for a medication reminder
export async function recordAdherence(userId, medicationId, wasTaken, actualTime, notes) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.insert(adherenceLogs).values({
      medicationId,
      takenAt: actualTime || new Date().toISOString(),
      wasTaken: wasTaken ? true : false,
      notes: notes || ''
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Error recording adherence:', error);
    throw new Error(`Failed to record adherence: ${error.message}`);
  }
}

// Get all adherence records for authenticated user
export async function getAdherenceRecords(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        id: adherenceLogs.id,
        medicationId: adherenceLogs.medicationId,
        takenAt: adherenceLogs.takenAt,
        wasTaken: adherenceLogs.wasTaken,
        notes: adherenceLogs.notes,
        createdAt: adherenceLogs.createdAt,
        medicationName: medications.name
      })
      .from(adherenceLogs)
      .innerJoin(medications, eq(adherenceLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(desc(adherenceLogs.createdAt));
    
    return records;
  } catch (error) {
    console.error('Error getting adherence records:', error);
    throw new Error(`Failed to get adherence records: ${error.message}`);
  }
}

// Get pending adherence records (this is a simplified version since we don't have a status field)
export async function getPendingAdherenceRecords(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // For now, get all user medications - you may want to implement more complex logic
    const records = await db.select()
      .from(medications)
      .where(eq(medications.userId, userId));
    
    return records;
  } catch (error) {
    console.error('Error getting pending adherence records:', error);
    throw new Error(`Failed to get pending adherence records: ${error.message}`);
  }
}

// Get overdue adherence records (medications not taken today)
export async function getOverdueAdherenceRecords(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // Simplified version - get active reminders for user medications
    const records = await db
      .select({
        id: medications.id,
        name: medications.name,
        dosage: medications.dosage,
        frequency: medications.frequency,
        time: reminders.time,
        isActive: reminders.isActive
      })
      .from(medications)
      .innerJoin(reminders, eq(medications.id, reminders.medicationId))
      .where(and(eq(medications.userId, userId), eq(reminders.isActive, true)));
    
    return records;
  } catch (error) {
    console.error('Error getting overdue adherence records:', error);
    throw new Error(`Failed to get overdue adherence records: ${error.message}`);
  }
}

// Get adherence summary for authenticated user
export async function getAdherenceSummary(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        id: adherenceLogs.id,
        wasTaken: adherenceLogs.wasTaken,
        medicationName: medications.name
      })
      .from(adherenceLogs)
      .innerJoin(medications, eq(adherenceLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId));
    
    const summary = {
      total: records.length,
      taken: records.filter(r => r.wasTaken === true).length,
      missed: records.filter(r => r.wasTaken === false).length,
    };
    
    summary.adherenceRate = summary.total > 0 ? 
      ((summary.taken / summary.total) * 100).toFixed(1) : 0;
    
    return summary;
  } catch (error) {
    console.error('Error getting adherence summary:', error);
    throw new Error(`Failed to get adherence summary: ${error.message}`);
  }
}

// Get adherence streaks for authenticated user
export async function getAdherenceStreaks(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        wasTaken: adherenceLogs.wasTaken,
        takenAt: adherenceLogs.takenAt
      })
      .from(adherenceLogs)
      .innerJoin(medications, eq(adherenceLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId))
      .orderBy(adherenceLogs.takenAt);
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    for (const record of records) {
      if (record.wasTaken === true) {
        tempStreak++;
        if (tempStreak === 1) currentStreak = tempStreak;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (tempStreak > 0 && currentStreak === tempStreak) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }
    
    return {
      current: currentStreak,
      longest: longestStreak,
    };
  } catch (error) {
    console.error('Error getting adherence streaks:', error);
    throw new Error(`Failed to get adherence streaks: ${error.message}`);
  }
}

// Get comprehensive adherence report with detailed analytics
export async function getAdherenceReport(userId, days = 30) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select()
      .from(adherenceLogs)
      .innerJoin(medications, eq(adherenceLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId));
    
    const summary = await getAdherenceSummary(userId);
    const streaks = await getAdherenceStreaks(userId);
    
    return {
      records,
      summary,
      streaks,
      period: days,
    };
  } catch (error) {
    console.error('Error getting adherence report:', error);
    throw new Error(`Failed to get adherence report: ${error.message}`);
  }
}

// Create adherence record
export async function createAdherenceRecord(userId, recordData) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.insert(adherenceLogs).values({
      medicationId: recordData.medication_id,
      takenAt: recordData.actual_time || new Date().toISOString(),
      wasTaken: recordData.status === 'taken' ? true : false,
      notes: recordData.notes || '',
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Error creating adherence record:', error);
    throw new Error(`Failed to create adherence record: ${error.message}`);
  }
}