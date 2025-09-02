// AdherenceTracker.js
// Handles medication adherence tracking logic using Drizzle ORM with new schema

import { getDatabase, isDatabaseInitialized, setupDatabase, adherenceRecords, adherenceStreaks, medications} from './database.js';
import { eq, desc, and, isNull, or } from 'drizzle-orm';

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

// Record adherence response for a medication reminder
export async function recordAdherence(userId, medicationId, status, scheduledTime, actualTime, notes, reminderId = null) {
  try {
    const db = await ensureDbInitialized();
    
    // Calculate if late and minutes late
    const scheduled = new Date(scheduledTime);
    const actual = actualTime ? new Date(actualTime) : new Date();
    const diffMinutes = Math.floor((actual - scheduled) / (1000 * 60));
    const isLate = diffMinutes > 0;
    
    const result = await db.insert(adherenceRecords).values({
      medicationId,
      reminderId,
      status, // 'taken', 'missed', 'skipped', 'pending'
      scheduledTime,
      actualTime: actualTime || new Date().toISOString(),
      responseTime: new Date().toISOString(),
      isLate,
      minutesLate: Math.max(0, diffMinutes),
      notes: notes || '',
      isDirty: true // Mark for sync
    }).returning();
    
    // Update adherence streak if status is 'taken'
    if (status === 'taken') {
      await updateAdherenceStreak(medicationId, true);
    } else if (status === 'missed') {
      await updateAdherenceStreak(medicationId, false);
    }
    
    return result[0];
  } catch (error) {
    console.error('Error recording adherence:', error);
    throw new Error(`Failed to record adherence: ${error.message}`);
  }
}

// Get adherence records for authenticated user
export async function getAdherenceRecords(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        id: adherenceRecords.id,
        medicationId: adherenceRecords.medicationId,
        reminderId: adherenceRecords.reminderId,
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime,
        actualTime: adherenceRecords.actualTime,
        responseTime: adherenceRecords.responseTime,
        isLate: adherenceRecords.isLate,
        minutesLate: adherenceRecords.minutesLate,
        notes: adherenceRecords.notes,
        createdAt: adherenceRecords.createdAt,
        medicationName: medications.name
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ))
      .orderBy(desc(adherenceRecords.scheduledTime));
    
    return records;
  } catch (error) {
    console.error('Error getting adherence records:', error);
    throw new Error(`Failed to get adherence records: ${error.message}`);
  }
}

// Get adherence records for a specific medication
export async function getAdherenceRecordsForMedication(userId, medicationId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select()
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceRecords.medicationId, medicationId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ))
      .orderBy(desc(adherenceRecords.scheduledTime));
    
    return records;
  } catch (error) {
    console.error('Error getting adherence records for medication:', error);
    throw new Error(`Failed to get adherence records for medication: ${error.message}`);
  }
}

// Update adherence streak for a medication
export async function updateAdherenceStreak(medicationId, wasTaken) {
  try {
    const db = await ensureDbInitialized();
    
    // Get existing streak or create new one
    const existingStreaks = await db
      .select()
      .from(adherenceStreaks)
      .where(eq(adherenceStreaks.medicationId, medicationId));
    
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (existingStreaks.length > 0) {
      const streak = existingStreaks[0];
      let newCurrentStreak = streak.currentStreak;
      let newLongestStreak = streak.longestStreak;
      let newLastTaken = streak.lastTaken;
      let newStreakStartDate = streak.streakStartDate;
      
      if (wasTaken) {
        newCurrentStreak += 1;
        newLastTaken = now;
        if (!newStreakStartDate) {
          newStreakStartDate = today;
        }
        if (newCurrentStreak > newLongestStreak) {
          newLongestStreak = newCurrentStreak;
        }
      } else {
        // Missed dose breaks the streak
        newCurrentStreak = 0;
        newStreakStartDate = null;
      }
      
      await db
        .update(adherenceStreaks)
        .set({
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastTaken: newLastTaken,
          streakStartDate: newStreakStartDate,
          updatedAt: now,
          isDirty: true
        })
        .where(eq(adherenceStreaks.medicationId, medicationId));
    } else {
      // Create new streak
      await db.insert(adherenceStreaks).values({
        medicationId,
        currentStreak: wasTaken ? 1 : 0,
        longestStreak: wasTaken ? 1 : 0,
        lastTaken: wasTaken ? now : null,
        streakStartDate: wasTaken ? today : null,
        isDirty: true
      });
    }
  } catch (error) {
    console.error('Error updating adherence streak:', error);
    throw new Error(`Failed to update adherence streak: ${error.message}`);
  }
}

// Get adherence streak for a medication
export async function getAdherenceStreak(userId, medicationId) {
  try {
    const db = await ensureDbInitialized();
    
    const streaks = await db
      .select()
      .from(adherenceStreaks)
      .innerJoin(medications, eq(adherenceStreaks.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceStreaks.medicationId, medicationId)
      ));
    
    return streaks.length > 0 ? streaks[0] : null;
  } catch (error) {
    console.error('Error getting adherence streak:', error);
    throw new Error(`Failed to get adherence streak: ${error.message}`);
  }
}

// Get adherence summary for a user
export async function getAdherenceSummary(userId, days = 30) {
  try {
    const db = await ensureDbInitialized();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    
    const records = await db
      .select({
        status: adherenceRecords.status,
        medicationName: medications.name
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    const summary = {
      totalDoses: records.length,
      takenDoses: records.filter(r => r.status === 'taken').length,
      missedDoses: records.filter(r => r.status === 'missed').length,
      skippedDoses: records.filter(r => r.status === 'skipped').length,
      pendingDoses: records.filter(r => r.status === 'pending').length
    };
    
    summary.adherenceRate = summary.totalDoses > 0 
      ? (summary.takenDoses / summary.totalDoses) * 100 
      : 0;
    
    return summary;
  } catch (error) {
    console.error('Error getting adherence summary:', error);
    throw new Error(`Failed to get adherence summary: ${error.message}`);
  }
}

// Get pending adherence responses (overdue reminders)
export async function getPendingAdherenceResponses(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const pendingRecords = await db
      .select({
        id: adherenceRecords.id,
        medicationId: adherenceRecords.medicationId,
        reminderId: adherenceRecords.reminderId,
        scheduledTime: adherenceRecords.scheduledTime,
        status: adherenceRecords.status,
        medicationName: medications.name
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceRecords.status, 'pending'),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ))
      .orderBy(adherenceRecords.scheduledTime);
    
    return pendingRecords;
  } catch (error) {
    console.error('Error getting pending adherence responses:', error);
    throw new Error(`Failed to get pending adherence responses: ${error.message}`);
  }
}
