// syncConfig.js
// Configuration and data transformation functions for sync operations

import { medications, schedules, adherenceRecords } from '../../db/schema.js';

// ====== Data Transformation Functions ======

const transformMedicationToBackend = (local) => ({
  name: local.name,
  directions: local.directions,
  side_effects: local.sideEffects,
  purpose: local.purpose,
  warnings: local.warnings,
  dosage_amount: local.dosageAmount,
  dosage_unit: local.dosageUnit,
  notes: local.notes,
  start_date: local.startDate,
  end_date: local.endDate,
  frequency: local.frequency,
});

const transformScheduleToBackend = (local) => ({
  medication: local.medicationBackendId, // Requires medication to be synced first
  time_of_day: local.timeOfDay,
  days_of_week: local.daysOfWeek,
  timezone: local.timezone,
  active: local.active,
  reminder_enabled: local.reminderEnabled,
});

const transformAdherenceToBackend = (local) => ({
  medication: local.medicationBackendId,
  reminder: local.reminderBackendId,
  status: local.status,
  scheduled_time: local.scheduledTime,
  actual_time: local.actualTime,
  notes: local.notes,
});

const genericTransformFromBackend = (backend, userId, extraFields = {}) => ({
  backendId: backend.id,
  userId,
  ...extraFields,
  isDirty: false,
  lastSynced: new Date().toISOString(),
});

// ====== Sync Configuration ======

export const syncConfig = {
  medications: {
    table: medications,
    endpoint: '/meds/',
    transformToBackend: transformMedicationToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
      name: backend.name,
      directions: backend.directions,
      sideEffects: backend.side_effects,
      purpose: backend.purpose,
      warnings: backend.warnings,
      dosageAmount: backend.dosage_amount,
      dosageUnit: backend.dosage_unit,
      notes: backend.notes,
      startDate: backend.start_date,
      endDate: backend.end_date,
      frequency: backend.frequency,
    }),
  },
  schedules: {
    table: schedules,
    endpoint: '/schedules/',
    dependencies: { medicationId: 'medications' },
    transformToBackend: transformScheduleToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
      medicationId: backend.medicationId, // Use the local ID from dependency resolution
      timeOfDay: backend.time_of_day,
      daysOfWeek: backend.days_of_week,
      timezone: backend.timezone,
      active: backend.active,
      reminderEnabled: backend.reminder_enabled,
    }),
  },
  adherenceRecords: {
    table: adherenceRecords,
    endpoint: '/adherence/records/',
    dependencies: { medicationId: 'medications', reminderId: 'reminders' },
    transformToBackend: transformAdherenceToBackend,
    transformFromBackend: (backend, userId) => genericTransformFromBackend(backend, userId, {
      medicationId: backend.medicationId, // Use the local ID from dependency resolution
      reminderId: backend.reminderId, // Use the local ID from dependency resolution
      status: backend.status,
      scheduledTime: backend.scheduled_time,
      actualTime: backend.actual_time,
      isLate: backend.is_late,
      minutesLate: backend.minutes_late,
      notes: backend.notes,
    }),
  },
};

// Export individual transformations for reuse
export {
  transformMedicationToBackend,
  transformScheduleToBackend,
  transformAdherenceToBackend,
  genericTransformFromBackend,
};
