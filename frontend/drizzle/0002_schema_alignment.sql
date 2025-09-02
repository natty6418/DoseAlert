-- Migration to align local schema with backend API schema

-- Add sync-related fields to medications table
ALTER TABLE `medications` ADD `backend_id` integer;--> statement-breakpoint
ALTER TABLE `medications` ADD `last_synced` text;--> statement-breakpoint
ALTER TABLE `medications` ADD `is_dirty` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `medications` ADD `is_deleted` integer DEFAULT false;--> statement-breakpoint

-- Create schedules table (matches backend API)
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`medication_id` integer NOT NULL,
	`time_of_day` text NOT NULL,
	`days_of_week` text,
	`timezone` text DEFAULT 'UTC',
	`active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	`is_deleted` integer DEFAULT false,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

-- Update reminders table to match backend API
ALTER TABLE `reminders` DROP COLUMN `time`;--> statement-breakpoint
ALTER TABLE `reminders` DROP COLUMN `is_active`;--> statement-breakpoint
ALTER TABLE `reminders` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `reminders` ADD `backend_id` integer;--> statement-breakpoint
ALTER TABLE `reminders` ADD `schedule_id` integer NOT NULL REFERENCES `schedules`(`id`);--> statement-breakpoint
ALTER TABLE `reminders` ADD `scheduled_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `reminders` ADD `sent_at` text;--> statement-breakpoint
ALTER TABLE `reminders` ADD `status` text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `reminders` ADD `last_synced` text;--> statement-breakpoint
ALTER TABLE `reminders` ADD `is_dirty` integer DEFAULT false;--> statement-breakpoint

-- Drop old adherence_logs table and create new adherence_records table
DROP TABLE `adherence_logs`;--> statement-breakpoint

CREATE TABLE `adherence_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`medication_id` integer NOT NULL,
	`reminder_id` integer,
	`status` text NOT NULL,
	`scheduled_time` text NOT NULL,
	`actual_time` text,
	`response_time` text,
	`is_late` integer DEFAULT false,
	`minutes_late` integer DEFAULT 0,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	`is_deleted` integer DEFAULT false,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reminder_id`) REFERENCES `reminders`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

-- Create adherence_streaks table (matches backend API)
CREATE TABLE `adherence_streaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`medication_id` integer NOT NULL,
	`current_streak` integer DEFAULT 0,
	`longest_streak` integer DEFAULT 0,
	`last_taken` text,
	`streak_start_date` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
