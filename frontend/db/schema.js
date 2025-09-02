import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Medications table
export const medications = sqliteTable('medications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  directions: text('directions'),
  sideEffects: text('side_effects'), // JSON string for array storage
  purpose: text('purpose'),
  warnings: text('warnings'),
  dosageAmount: text('dosage_amount').notNull(), // Store as text to preserve decimal precision
  dosageUnit: text('dosage_unit').notNull(),
  notes: text('notes'),
  startDate: text('start_date').notNull(), // SQLite stores dates as text
  endDate: text('end_date'),
  frequency: text('frequency').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Reminders table
export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  time: text('time').notNull(), // SQLite stores time as text
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

// Adherence logs table
export const adherenceLogs = sqliteTable('adherence_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  medicationId: integer('medication_id').notNull().references(() => medications.id),
  takenAt: text('taken_at').notNull(), // SQLite stores datetime as text
  wasTaken: integer('was_taken', { mode: 'boolean' }).notNull(),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
