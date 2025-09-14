import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Medications table - matches backend API schema
export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backendId: integer('backend_id'), // ID from backend API (null for guest-only meds)
  userId: integer('user_id').notNull(), // Backend user ID or 1 for guest
  name: text('name').notNull(),
  directions: text('directions'),
  sideEffects: text('side_effects'),
  purpose: text('purpose'),
  warnings: text('warnings'),
  dosageAmount: text('dosage_amount').notNull(), // Store as text to preserve decimal precision
  dosageUnit: text('dosage_unit').notNull(), // mg, g, ml, pills
  notes: text('notes'),
  startDate: text('start_date').notNull(), // YYYY-MM-DD format
  endDate: text('end_date'), // YYYY-MM-DD format
  frequency: text('frequency').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  // Sync fields
  lastSynced: text('last_synced'), // Last time synced with backend
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false), // Has local changes not synced
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false) // Soft delete flag
});

// Schedules table - matches backend API schema
export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backendId: integer('backend_id'), // ID from backend API (null for guest-only schedules)
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  timeOfDay: text('time_of_day').notNull(), // HH:MM:SS format
  daysOfWeek: text('days_of_week'), // Comma-separated: "Mon,Tue,Wed,Thu,Fri"
  timezone: text('timezone').default('UTC'),
  active: integer('active', { mode: 'boolean' }).default(true),
  reminderEnabled: integer('reminder_enabled', { mode: 'boolean' }).default(true), // Whether reminders are enabled for this schedule
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  // Sync fields
  lastSynced: text('last_synced'),
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false)
});

// Reminders table - generated from schedules, matches backend API
export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backendId: integer('backend_id'), // ID from backend API
  scheduleId: integer('schedule_id').notNull().references(() => schedules.id),
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  scheduledAt: text('scheduled_at').notNull(), // Full datetime: YYYY-MM-DDTHH:MM:SSZ
  sentAt: text('sent_at'), // When notification was sent
  status: text('status').default('pending'), // pending, sent, failed
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  // Sync fields
  lastSynced: text('last_synced'),
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false)
});

// Adherence records table - matches backend API schema
export const adherenceRecords = sqliteTable('adherence_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backendId: integer('backend_id'), // ID from backend API
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  reminderId: integer('reminder_id').references(() => reminders.id), // Can be null for manual entries
  status: text('status').notNull(), // taken, missed, skipped, pending
  scheduledTime: text('scheduled_time').notNull(), // YYYY-MM-DDTHH:MM:SSZ
  actualTime: text('actual_time'), // When actually taken
  responseTime: text('response_time'), // When user responded
  isLate: integer('is_late', { mode: 'boolean' }).default(false),
  minutesLate: integer('minutes_late').default(0),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  // Sync fields
  lastSynced: text('last_synced'),
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false)
});

// Adherence streaks table - matches backend API schema
export const adherenceStreaks = sqliteTable('adherence_streaks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  backendId: integer('backend_id'), // ID from backend API
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastTaken: text('last_taken'), // YYYY-MM-DDTHH:MM:SSZ
  streakStartDate: text('streak_start_date'), // YYYY-MM-DD
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  // Sync fields
  lastSynced: text('last_synced'),
  isDirty: integer('is_dirty', { mode: 'boolean' }).default(false)
});