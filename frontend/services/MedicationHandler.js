// MedicationHandler.js
// Handles medication CRUD logic using Drizzle ORM

import { getDatabase, isDatabaseInitialized, setupDatabase, medications, schedules } from './database.js';
import { eq, and, desc, inArray } from 'drizzle-orm';

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

// Transform medication data to database format
function transformToDbFormat(medicationData) {
  let sideEffectsString = '';
  if (Array.isArray(medicationData.medicationSpecification?.sideEffects)) {
    sideEffectsString = JSON.stringify(medicationData.medicationSpecification.sideEffects);
  } else if (Array.isArray(medicationData.side_effects)) {
    sideEffectsString = JSON.stringify(medicationData.side_effects);
  } else if (medicationData.medicationSpecification?.sideEffects) {
    sideEffectsString = medicationData.medicationSpecification.sideEffects;
  } else if (medicationData.side_effects) {
    sideEffectsString = medicationData.side_effects;
  }

  return {
    name: medicationData.medicationSpecification?.name || medicationData.name,
    directions: medicationData.medicationSpecification?.directions || medicationData.directions,
    sideEffects: sideEffectsString,
    purpose: medicationData.medicationSpecification?.purpose || medicationData.purpose,
    warnings: medicationData.medicationSpecification?.warnings || medicationData.warnings,
    dosageAmount: medicationData.dosage?.amount || medicationData.dosage_amount || '0',
    dosageUnit: medicationData.dosage?.unit || medicationData.dosage_unit || 'mg',
    notes: medicationData.notes || '',
    startDate: medicationData.start_date ? new Date(medicationData.start_date).toISOString().split('T')[0] : 
               new Date().toISOString().split('T')[0],
    endDate: medicationData.end_date ? new Date(medicationData.end_date).toISOString().split('T')[0] : null,
    frequency: medicationData.frequency || 'Daily',
  };
}

// Transform database medication data to app format
function transformFromDbFormat(dbData, schedules = []) {
  let sideEffects = [];
  try {
    sideEffects = dbData.sideEffects ? JSON.parse(dbData.sideEffects) : [];
  } catch {
    // If parsing fails, treat as string and convert to array
    sideEffects = dbData.sideEffects ? [dbData.sideEffects] : [];
  }

  // Process schedules to extract reminder information
  const reminderTimes = schedules.map(schedule => {
    // Convert time string (HH:MM:SS) to Date object for today
    const [hours, minutes, seconds] = schedule.timeOfDay.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || 0), 0);
    return date;
  });

  // Check if any schedule has reminders enabled
  const reminderEnabled = schedules.some(schedule => schedule.reminderEnabled);

  // Determine if medication is active based on end date
  const now = new Date();
  const endDate = dbData.endDate ? new Date(dbData.endDate) : null;
  const isActive = !endDate || endDate >= now;

  return {
    id: dbData.id,
    name: dbData.name,
    directions: dbData.directions,
    side_effects: sideEffects,
    purpose: dbData.purpose,
    warnings: dbData.warnings,
    dosage_amount: dbData.dosageAmount,
    dosage_unit: dbData.dosageUnit,
    notes: dbData.notes,
    start_date: dbData.startDate,
    end_date: dbData.endDate,
    frequency: dbData.frequency,
    // Also provide the nested format for backward compatibility
    medicationSpecification: {
      name: dbData.name,
      directions: dbData.directions,
      sideEffects: sideEffects,
      purpose: dbData.purpose,
      warnings: dbData.warnings,
    },
    dosage: {
      amount: dbData.dosageAmount,
      unit: dbData.dosageUnit,
    },
    isActive,
    reminder: {
      enabled: reminderEnabled,
      times: reminderTimes,
    },
    createdAt: dbData.createdAt ? new Date(dbData.createdAt) : new Date(),
  };
}

// Create a new medication
export async function addMedication(userId, medicationData) {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      const db = await ensureDbInitialized();
      const dbData = transformToDbFormat(medicationData);
      
      const result = await db.insert(medications).values({
        userId,
        ...dbData
      }).returning();
      
      // Get schedules for the new medication (should be empty for new medications)
      const medicationSchedules = await db.select()
        .from(schedules)
        .where(eq(schedules.medicationId, result[0].id));
      
      return transformFromDbFormat(result[0], medicationSchedules);
    } catch (error) {
      console.error(`Error adding medication (attempt ${retryCount + 1}):`, error);
      
      // If it's a database lock error, wait and retry
      if (error.message.includes('database is locked') && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying medication insert... (attempt ${retryCount + 1})`);
        // Wait for a short time before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        continue;
      }
      
      throw new Error(`Failed to add medication: ${error.message}`);
    }
  }
}

// Get all medications for authenticated user
export async function getMedications(userId) {
  try {
    const db = await ensureDbInitialized();
    
    // First get all medications
    const medicationResults = await db.select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.createdAt));
    
    // Get medication IDs to query schedules
    const medicationIds = medicationResults.map(med => med.id);
    
    // Then get all schedules for these medications
    let scheduleResults = [];
    if (medicationIds.length > 0) {
      scheduleResults = await db.select()
        .from(schedules)
        .where(inArray(schedules.medicationId, medicationIds));
    }
    
    // Transform medications and include reminder data from schedules
    const transformedMedications = medicationResults.map(medication => {
      // Find schedules for this medication
      const medicationSchedules = scheduleResults.filter(
        schedule => schedule.medicationId === medication.id
      );
      
      return transformFromDbFormat(medication, medicationSchedules);
    });
    
    return transformedMedications;
  } catch (error) {
    console.error('Error getting medications:', error);
    throw new Error(`Failed to get medications: ${error.message}`);
  }
}

// Get a specific medication
export async function getMedication(userId, medicationId) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.select()
      .from(medications)
      .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)));
    
    if (!result || result.length === 0) {
      throw new Error('Medication not found');
    }
    
    // Get schedules for this medication
    const medicationSchedules = await db.select()
      .from(schedules)
      .where(eq(schedules.medicationId, medicationId));
    
    return transformFromDbFormat(result[0], medicationSchedules);
  } catch (error) {
    console.error('Error getting medication:', error);
    throw new Error(`Failed to get medication: ${error.message}`);
  }
}

// Update a medication
export async function updateMedication(userId, medicationId, updates) {
  try {
    const db = await ensureDbInitialized();
    const dbData = transformToDbFormat(updates);
    
    const result = await db.update(medications)
      .set(dbData)
      .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)))
      .returning();
    
    if (!result || result.length === 0) {
      throw new Error('Medication not found or update failed');
    }
    
    // Update schedules if reminder settings have changed
    if (updates.reminder) {
      await db.update(schedules)
        .set({ reminderEnabled: updates.reminder.enabled })
        .where(eq(schedules.medicationId, medicationId));
    }
    
    // Get schedules for the updated medication
    const medicationSchedules = await db.select()
      .from(schedules)
      .where(eq(schedules.medicationId, medicationId));
    
    return transformFromDbFormat(result[0], medicationSchedules);
  } catch (error) {
    console.error('Error updating medication:', error);
    throw new Error(`Failed to update medication: ${error.message}`);
  }
}

// Delete a medication
export async function deleteMedication(userId, medicationId) {
  try {
    const db = await ensureDbInitialized();
    
    await db.delete(medications)
      .where(and(eq(medications.id, medicationId), eq(medications.userId, userId)));
    
    return true;
  } catch (error) {
    console.error('Error deleting medication:', error);
    throw new Error(`Failed to delete medication: ${error.message}`);
  }
}

// Legacy function for backward compatibility
export async function addNewMedication(medicationData) {
  // This function should be updated to use the new pattern
  // For now, it returns a compatible structure
  return {
    data: {
      id: Date.now().toString(),
      medicationSpecification: {
        name: medicationData.name,
        directions: medicationData.directions,
        sideEffects: medicationData.sideEffects || [],
        purpose: medicationData.purpose,
        warnings: medicationData.warning,
      },
      dosage: medicationData.dosage,
      startDate: medicationData.startDate,
      endDate: medicationData.endDate,
      frequency: medicationData.frequency,
      reminder: {
        enabled: medicationData.reminderEnabled,
        times: medicationData.reminderTimes || [],
      },
      isActive: true,
    },
    error: null,
  };
}

// ===== SCHEDULE MANAGEMENT =====

// Transform app schedule data to database format
function transformScheduleToDbFormat(scheduleData, medicationId) {
  return {
    medication_id: medicationId,
    time_of_day: scheduleData.time || '08:00:00',
    days_of_week: scheduleData.days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    timezone: scheduleData.timezone || 'UTC',
    active: scheduleData.active !== false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Transform database schedule data to app format
function transformScheduleFromDbFormat(dbData) {
  return {
    id: dbData.id,
    medicationId: dbData.medication_id,
    time: dbData.time_of_day,
    days: dbData.days_of_week,
    timezone: dbData.timezone,
    active: dbData.active,
    createdAt: dbData.created_at ? new Date(dbData.created_at) : new Date(),
  };
}

// Create a new schedule
export async function addSchedule(userId, medicationId, scheduleData) {
  try {
    const db = await ensureDbInitialized();
    const dbData = transformScheduleToDbFormat(scheduleData, medicationId);
    
    const result = await db.runAsync(
      `INSERT INTO reminders (
        medication_id, time, is_active
      ) VALUES (?, ?, ?)`,
      [
        medicationId,
        dbData.time_of_day,
        dbData.active ? 1 : 0
      ]
    );
    
    // Get the created reminder
    const reminder = await db.getFirstAsync(
      'SELECT * FROM reminders WHERE id = ?',
      [result.lastInsertRowId]
    );
    
    return transformScheduleFromDbFormat(reminder);
  } catch (error) {
    console.error('Error adding schedule:', error);
    throw new Error(`Failed to add schedule: ${error.message}`);
  }
}

// Get all schedules for authenticated user
export async function getSchedules(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const schedules = await db.getAllAsync(
      `SELECT r.*, m.name as medication_name 
       FROM reminders r 
       JOIN medications m ON r.medication_id = m.id 
       WHERE m.user_id = ? 
       ORDER BY r.time`,
      [userId]
    );
    
    return schedules.map(transformScheduleFromDbFormat);
  } catch (error) {
    console.error('Error getting schedules:', error);
    throw new Error(`Failed to get schedules: ${error.message}`);
  }
}

// Update a schedule
export async function updateSchedule(userId, scheduleId, updates) {
  try {
    const db = await ensureDbInitialized();
    
    await db.runAsync(
      `UPDATE reminders SET 
        time = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND medication_id IN (
        SELECT id FROM medications WHERE user_id = ?
      )`,
      [
        updates.time || '08:00:00',
        updates.active ? 1 : 0,
        scheduleId,
        userId
      ]
    );
    
    // Get the updated reminder
    const reminder = await db.getFirstAsync(
      'SELECT * FROM reminders WHERE id = ?',
      [scheduleId]
    );
    
    return transformScheduleFromDbFormat(reminder);
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error(`Failed to update schedule: ${error.message}`);
  }
}

// Delete a schedule
export async function deleteSchedule(userId, scheduleId) {
  try {
    const db = await ensureDbInitialized();
    
    await db.runAsync(
      `DELETE FROM reminders 
      WHERE id = ? AND medication_id IN (
        SELECT id FROM medications WHERE user_id = ?
      )`,
      [scheduleId, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }
}



