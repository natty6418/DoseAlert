// AnalyticsHandler.js
// Handles analytics-related operations using Drizzle ORM

import { getDatabase, isDatabaseInitialized, setupDatabase, medications, adherenceLogs, reminders } from './database.js';
import { eq, count } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  if (!isDatabaseInitialized()) {
    await setupDatabase();
  }
  return getDatabase();
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
    const adherenceRecords = await db
      .select()
      .from(adherenceLogs)
      .innerJoin(medications, eq(adherenceLogs.medicationId, medications.id))
      .where(eq(medications.userId, userId));
    
    // Calculate adherence rate
    const totalRecords = adherenceRecords.length;
    const takenRecords = adherenceRecords.filter(r => r.adherence_logs.wasTaken === true).length;
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
        taken: adherenceRecords.filter(r => r.was_taken === 1).length,
        missed: adherenceRecords.filter(r => r.was_taken === 0).length,
      }
    };
  } catch (error) {
    console.error('Error getting analytics summary:', error);
    throw new Error(`Failed to get analytics summary: ${error.message}`);
  }
}
