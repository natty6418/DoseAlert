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

// Auto-mark pending notifications as missed after 1 hour
export async function autoMarkMissedDoses(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // Find pending records that are more than 1 hour overdue
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const overdueRecords = await db
      .select({
        id: adherenceRecords.id,
        medicationId: adherenceRecords.medicationId,
        reminderId: adherenceRecords.reminderId,
        scheduledTime: adherenceRecords.scheduledTime
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceRecords.status, 'pending'),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    // Filter records where scheduled time is more than 1 hour ago
    const recordsToMarkMissed = overdueRecords.filter(record => {
      const scheduledTime = new Date(record.scheduledTime);
      return scheduledTime <= oneHourAgo;
    });
    
    // Update each overdue record to 'missed'
    for (const record of recordsToMarkMissed) {
      await db
        .update(adherenceRecords)
        .set({
          status: 'missed',
          responseTime: new Date().toISOString(),
          isDirty: true
        })
        .where(eq(adherenceRecords.id, record.id));
      
      // Update streak for missed dose
      await updateAdherenceStreak(record.medicationId, false);
    }
    
    console.log(`Auto-marked ${recordsToMarkMissed.length} doses as missed`);
    return recordsToMarkMissed.length;
    
  } catch (error) {
    console.error('Error auto-marking missed doses:', error);
    throw new Error(`Failed to auto-mark missed doses: ${error.message}`);
  }
}

// Create adherence record when notification is sent
export async function createPendingAdherenceRecord(userId, medicationId, scheduledTime, reminderId = null) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.insert(adherenceRecords).values({
      medicationId,
      reminderId,
      status: 'pending',
      scheduledTime,
      actualTime: null,
      responseTime: null,
      isLate: false,
      minutesLate: 0,
      notes: 'Notification sent',
      isDirty: true
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Error creating pending adherence record:', error);
    throw new Error(`Failed to create pending adherence record: ${error.message}`);
  }
}

// 1. TIME-BASED ANALYTICS

// Get adherence analytics by time of day
export async function getAdherenceByTimeOfDay(userId, days = 30) {
  try {
    const db = await ensureDbInitialized();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const records = await db
      .select({
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    // Group by hour ranges (morning, afternoon, evening, night)
    const timeSlots = {
      morning: { name: 'Morning (6AM-12PM)', taken: 0, total: 0, hours: [6, 7, 8, 9, 10, 11] },
      afternoon: { name: 'Afternoon (12PM-6PM)', taken: 0, total: 0, hours: [12, 13, 14, 15, 16, 17] },
      evening: { name: 'Evening (6PM-10PM)', taken: 0, total: 0, hours: [18, 19, 20, 21] },
      night: { name: 'Night (10PM-6AM)', taken: 0, total: 0, hours: [22, 23, 0, 1, 2, 3, 4, 5] }
    };
    
    records.forEach(record => {
      const hour = new Date(record.scheduledTime).getHours();
      
      for (const slot of Object.values(timeSlots)) {
        if (slot.hours.includes(hour)) {
          slot.total++;
          if (record.status === 'taken') {
            slot.taken++;
          }
          break;
        }
      }
    });
    
    // Calculate adherence rates and find best/worst times
    const results = Object.entries(timeSlots).map(([key, slot]) => ({
      timeSlot: key,
      name: slot.name,
      adherenceRate: slot.total > 0 ? Math.round((slot.taken / slot.total) * 100) : 0,
      takenDoses: slot.taken,
      totalDoses: slot.total
    }));
    
    // Sort by adherence rate to find best/worst
    const sortedResults = [...results].sort((a, b) => b.adherenceRate - a.adherenceRate);
    
    return {
      timeSlots: results,
      bestTime: sortedResults[0],
      worstTime: sortedResults[sortedResults.length - 1],
      summary: `Best adherence in ${sortedResults[0].name} (${sortedResults[0].adherenceRate}%)`
    };
  } catch (error) {
    console.error('Error getting adherence by time of day:', error);
    throw new Error(`Failed to get time-based adherence analytics: ${error.message}`);
  }
}

// Get adherence analytics by day of week
export async function getAdherenceByDayOfWeek(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    const dayStats = {
      0: { name: 'Sunday', taken: 0, total: 0 },
      1: { name: 'Monday', taken: 0, total: 0 },
      2: { name: 'Tuesday', taken: 0, total: 0 },
      3: { name: 'Wednesday', taken: 0, total: 0 },
      4: { name: 'Thursday', taken: 0, total: 0 },
      5: { name: 'Friday', taken: 0, total: 0 },
      6: { name: 'Saturday', taken: 0, total: 0 }
    };
    
    records.forEach(record => {
      const dayOfWeek = new Date(record.scheduledTime).getDay();
      dayStats[dayOfWeek].total++;
      if (record.status === 'taken') {
        dayStats[dayOfWeek].taken++;
      }
    });
    
    const results = Object.entries(dayStats).map(([day, stats]) => ({
      dayOfWeek: parseInt(day),
      name: stats.name,
      adherenceRate: stats.total > 0 ? Math.round((stats.taken / stats.total) * 100) : 0,
      takenDoses: stats.taken,
      totalDoses: stats.total
    }));
    
    const sortedResults = [...results].sort((a, b) => b.adherenceRate - a.adherenceRate);
    
    return {
      dayStats: results,
      bestDay: sortedResults[0],
      worstDay: sortedResults[sortedResults.length - 1],
      summary: `Best adherence on ${sortedResults[0].name}s (${sortedResults[0].adherenceRate}%)`
    };
  } catch (error) {
    console.error('Error getting adherence by day of week:', error);
    throw new Error(`Failed to get day-based adherence analytics: ${error.message}`);
  }
}

// Get average time to take medication after scheduled time
export async function getAverageTimeToTake(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        scheduledTime: adherenceRecords.scheduledTime,
        actualTime: adherenceRecords.actualTime,
        status: adherenceRecords.status,
        minutesLate: adherenceRecords.minutesLate
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        eq(adherenceRecords.status, 'taken'),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    if (records.length === 0) {
      return {
        averageMinutesLate: 0,
        totalTakenDoses: 0,
        onTimePercentage: 0,
        summary: 'No taken doses to analyze'
      };
    }
    
    const totalMinutesLate = records.reduce((sum, record) => sum + (record.minutesLate || 0), 0);
    const averageMinutesLate = Math.round(totalMinutesLate / records.length);
    const onTimeDoses = records.filter(record => (record.minutesLate || 0) <= 15).length; // Within 15 minutes
    const onTimePercentage = Math.round((onTimeDoses / records.length) * 100);
    
    let summary;
    if (averageMinutesLate <= 15) {
      summary = 'Excellent timing! Most doses taken on schedule';
    } else if (averageMinutesLate <= 60) {
      summary = 'Good timing with room for improvement';
    } else {
      summary = 'Consider setting earlier reminders to improve timing';
    }
    
    return {
      averageMinutesLate,
      totalTakenDoses: records.length,
      onTimePercentage,
      summary
    };
  } catch (error) {
    console.error('Error getting average time to take:', error);
    throw new Error(`Failed to get timing analytics: ${error.message}`);
  }
}

// 3. PATTERN RECOGNITION

// Get adherence consistency score (how consistent day-to-day adherence is)
export async function getAdherenceConsistency(userId, days = 30) {
  try {
    const db = await ensureDbInitialized();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const records = await db
      .select({
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    // Group by date
    const dailyStats = {};
    records.forEach(record => {
      const date = new Date(record.scheduledTime).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { taken: 0, total: 0 };
      }
      dailyStats[date].total++;
      if (record.status === 'taken') {
        dailyStats[date].taken++;
      }
    });
    
    // Calculate daily adherence rates
    const dailyRates = Object.values(dailyStats).map(day => 
      day.total > 0 ? (day.taken / day.total) * 100 : 0
    );
    
    if (dailyRates.length === 0) {
      return {
        consistencyScore: 0,
        averageDailyRate: 0,
        daysAnalyzed: 0,
        summary: 'No data available for consistency analysis'
      };
    }
    
    // Calculate standard deviation to measure consistency
    const averageRate = dailyRates.reduce((sum, rate) => sum + rate, 0) / dailyRates.length;
    const variance = dailyRates.reduce((sum, rate) => sum + Math.pow(rate - averageRate, 2), 0) / dailyRates.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consistency score: lower standard deviation = higher consistency
    const consistencyScore = Math.max(0, Math.round(100 - standardDeviation));
    
    let summary;
    if (consistencyScore >= 80) {
      summary = 'Very consistent adherence pattern';
    } else if (consistencyScore >= 60) {
      summary = 'Moderately consistent with some variation';
    } else {
      summary = 'Adherence varies significantly day-to-day';
    }
    
    return {
      consistencyScore,
      averageDailyRate: Math.round(averageRate),
      daysAnalyzed: dailyRates.length,
      summary
    };
  } catch (error) {
    console.error('Error getting adherence consistency:', error);
    throw new Error(`Failed to get consistency analytics: ${error.message}`);
  }
}

// Identify risk periods when user is most likely to miss doses
export async function getRiskPeriods(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const records = await db
      .select({
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ));
    
    // Analyze patterns for missed doses
    const missedDoses = records.filter(record => record.status === 'missed');
    
    if (missedDoses.length === 0) {
      return {
        riskPeriods: [],
        totalMissed: 0,
        summary: 'No missed doses detected - great job!'
      };
    }
    
    // Group missed doses by time of day
    const hourlyMisses = {};
    missedDoses.forEach(record => {
      const hour = new Date(record.scheduledTime).getHours();
      hourlyMisses[hour] = (hourlyMisses[hour] || 0) + 1;
    });
    
    // Find hours with highest miss rates
    const riskHours = Object.entries(hourlyMisses)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        timeRange: formatTimeRange(parseInt(hour)),
        missedCount: count,
        percentage: Math.round((count / missedDoses.length) * 100)
      }))
      .filter(item => item.percentage >= 15) // Only show significant risk periods
      .sort((a, b) => b.missedCount - a.missedCount);
    
    const topRiskPeriod = riskHours[0];
    const summary = topRiskPeriod 
      ? `Highest risk period: ${topRiskPeriod.timeRange} (${topRiskPeriod.percentage}% of missed doses)`
      : 'No significant risk patterns detected';
    
    return {
      riskPeriods: riskHours,
      totalMissed: missedDoses.length,
      summary
    };
  } catch (error) {
    console.error('Error getting risk periods:', error);
    throw new Error(`Failed to get risk period analytics: ${error.message}`);
  }
}

// Helper function to format time ranges
function formatTimeRange(hour) {
  const nextHour = (hour + 1) % 24;
  const formatHour = (h) => {
    if (h === 0) return '12AM';
    if (h === 12) return '12PM';
    return h > 12 ? `${h - 12}PM` : `${h}AM`;
  };
  return `${formatHour(hour)} - ${formatHour(nextHour)}`;
}

// 5. STREAK ANALYTICS

// Get comprehensive streak analytics
export async function getStreakAnalytics(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // Get all streaks for user's medications
    const streaks = await db
      .select({
        medicationId: adherenceStreaks.medicationId,
        medicationName: medications.name,
        currentStreak: adherenceStreaks.currentStreak,
        longestStreak: adherenceStreaks.longestStreak,
        lastTaken: adherenceStreaks.lastTaken,
        streakStartDate: adherenceStreaks.streakStartDate
      })
      .from(adherenceStreaks)
      .innerJoin(medications, eq(adherenceStreaks.medicationId, medications.id))
      .where(eq(medications.userId, userId));
    
    if (streaks.length === 0) {
      return {
        totalMedications: 0,
        averageCurrentStreak: 0,
        averageLongestStreak: 0,
        bestPerformer: null,
        overallStreakScore: 0,
        summary: 'No streak data available'
      };
    }
    
    // Calculate streak analytics
    const currentStreaks = streaks.map(s => s.currentStreak || 0);
    const longestStreaks = streaks.map(s => s.longestStreak || 0);
    
    const averageCurrentStreak = Math.round(
      currentStreaks.reduce((sum, streak) => sum + streak, 0) / currentStreaks.length
    );
    
    const averageLongestStreak = Math.round(
      longestStreaks.reduce((sum, streak) => sum + streak, 0) / longestStreaks.length
    );
    
    // Find best performing medication
    const bestPerformer = streaks.reduce((best, current) => {
      const currentScore = (current.currentStreak || 0) + (current.longestStreak || 0);
      const bestScore = (best?.currentStreak || 0) + (best?.longestStreak || 0);
      return currentScore > bestScore ? current : best;
    }, null);
    
    // Calculate overall streak score (0-100)
    const maxPossibleStreak = 30; // Assume 30 days is excellent
    const streakScore = Math.min(100, Math.round((averageCurrentStreak / maxPossibleStreak) * 100));
    
    let summary;
    if (streakScore >= 80) {
      summary = 'Outstanding streak performance!';
    } else if (streakScore >= 60) {
      summary = 'Good streak momentum, keep it up!';
    } else if (streakScore >= 30) {
      summary = 'Building streak habits, stay consistent!';
    } else {
      summary = 'Focus on building daily consistency';
    }
    
    return {
      totalMedications: streaks.length,
      averageCurrentStreak,
      averageLongestStreak,
      bestPerformer: bestPerformer ? {
        medicationName: bestPerformer.medicationName,
        currentStreak: bestPerformer.currentStreak,
        longestStreak: bestPerformer.longestStreak
      } : null,
      overallStreakScore: streakScore,
      medicationStreaks: streaks.map(streak => ({
        medicationName: streak.medicationName,
        currentStreak: streak.currentStreak || 0,
        longestStreak: streak.longestStreak || 0,
        isActive: streak.currentStreak > 0
      })),
      summary
    };
  } catch (error) {
    console.error('Error getting streak analytics:', error);
    throw new Error(`Failed to get streak analytics: ${error.message}`);
  }
}

// Get streak frequency analysis (how often user achieves different streak lengths)
export async function getStreakFrequency(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // Get adherence records to analyze streak patterns
    const records = await db
      .select({
        medicationId: adherenceRecords.medicationId,
        status: adherenceRecords.status,
        scheduledTime: adherenceRecords.scheduledTime,
        medicationName: medications.name
      })
      .from(adherenceRecords)
      .innerJoin(medications, eq(adherenceRecords.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(adherenceRecords.isDeleted, false), isNull(adherenceRecords.isDeleted))
      ))
      .orderBy(adherenceRecords.scheduledTime);
    
    // Group by medication and calculate historical streaks
    const medicationRecords = {};
    records.forEach(record => {
      if (!medicationRecords[record.medicationId]) {
        medicationRecords[record.medicationId] = {
          name: record.medicationName,
          records: []
        };
      }
      medicationRecords[record.medicationId].records.push(record);
    });
    
    // Analyze streak patterns for each medication
    let allStreaks = [];
    
    Object.values(medicationRecords).forEach(med => {
      const streaks = calculateHistoricalStreaks(med.records);
      allStreaks = allStreaks.concat(streaks);
    });
    
    // Categorize streaks by length
    const streakCategories = {
      short: { name: '1-3 days', count: 0, range: [1, 3] },
      medium: { name: '4-7 days', count: 0, range: [4, 7] },
      long: { name: '1-2 weeks', count: 0, range: [8, 14] },
      excellent: { name: '2+ weeks', count: 0, range: [15, Infinity] }
    };
    
    allStreaks.forEach(streak => {
      for (const category of Object.values(streakCategories)) {
        if (streak >= category.range[0] && streak <= category.range[1]) {
          category.count++;
          break;
        }
      }
    });
    
    const totalStreaks = allStreaks.length;
    const results = Object.entries(streakCategories).map(([key, category]) => ({
      category: key,
      name: category.name,
      count: category.count,
      percentage: totalStreaks > 0 ? Math.round((category.count / totalStreaks) * 100) : 0
    }));
    
    return {
      streakFrequency: results,
      totalStreaksAnalyzed: totalStreaks,
      averageStreakLength: totalStreaks > 0 ? Math.round(allStreaks.reduce((sum, streak) => sum + streak, 0) / totalStreaks) : 0,
      summary: totalStreaks > 0 
        ? `You've completed ${totalStreaks} streaks with an average length of ${Math.round(allStreaks.reduce((sum, streak) => sum + streak, 0) / totalStreaks)} days`
        : 'No completed streaks to analyze yet'
    };
  } catch (error) {
    console.error('Error getting streak frequency:', error);
    throw new Error(`Failed to get streak frequency analytics: ${error.message}`);
  }
}

// Helper function to calculate historical streaks from adherence records
function calculateHistoricalStreaks(records) {
  const streaks = [];
  let currentStreak = 0;
  
  records.forEach((record, index) => {
    if (record.status === 'taken') {
      currentStreak++;
    } else if (record.status === 'missed' && currentStreak > 0) {
      // Streak broken, record it if it was at least 1 day
      streaks.push(currentStreak);
      currentStreak = 0;
    }
    
    // If this is the last record and we have an active streak, record it
    if (index === records.length - 1 && currentStreak > 0) {
      streaks.push(currentStreak);
    }
  });
  
  return streaks;
}
