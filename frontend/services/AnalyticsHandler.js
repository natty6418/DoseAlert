// AnalyticsHandler.js
// Handles analytics-related operations using Drizzle ORM with new schema

import { getDatabase, isDatabaseInitialized, setupDatabase, medications, adherenceRecords, reminders } from './database.js';
import { eq, count, and, isNull, or } from 'drizzle-orm';

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

// Get analytics summary
export async function getAnalyticsSummary(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // Get total medications
    const totalMedicationsResult = await db
      .select({ count: count() })
      .from(medications)
      .where(eq(medications.userId, userId));
    const totalMedications = totalMedicationsResult[0]?.count || 0;
    
    // Get adherence records for analytics
    const adherenceData = await db
      .select()
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    // Calculate adherence rate
    const totalRecords = adherenceData.length;
    const takenRecords = adherenceData.filter(r => r.adherence_records.status === 'taken').length;
    const missedRecords = adherenceData.filter(r => r.adherence_records.status === 'missed').length;
    const skippedRecords = adherenceData.filter(r => r.adherence_records.status === 'skipped').length;
    const adherenceRate = totalRecords > 0 ? (takenRecords / totalRecords) * 100 : 0;
    
    // Get recent reminders (simplified version)
    const recentRemindersResult = await db
      .select({ count: count() })
      .from(reminders)
      .innerJoin(medications, eq(reminders.medicationId, medications.id))
      .where(eq(medications.userId, userId));
    const recentReminders = recentRemindersResult[0]?.count || 0;
    
    return {
      totalMedications,
      adherenceRate: Math.round(adherenceRate),
      totalAdherenceRecords: totalRecords,
      recentReminders,
      summary: {
        taken: takenRecords,
        missed: missedRecords,
        skipped: skippedRecords,
      }
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw new Error(`Failed to get analytics summary: ${error.message}`);
  }
}
