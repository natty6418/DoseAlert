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
);
--> statement-breakpoint
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
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`directions` text,
	`side_effects` text,
	`purpose` text,
	`warnings` text,
	`dosage_amount` text NOT NULL,
	`dosage_unit` text NOT NULL,
	`notes` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`frequency` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	`is_deleted` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `reminders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`schedule_id` integer NOT NULL,
	`medication_id` integer NOT NULL,
	`scheduled_at` text NOT NULL,
	`sent_at` text,
	`status` text DEFAULT 'pending',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`backend_id` integer,
	`medication_id` integer NOT NULL,
	`time_of_day` text NOT NULL,
	`days_of_week` text,
	`timezone` text DEFAULT 'UTC',
	`active` integer DEFAULT true,
	`reminder_enabled` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`last_synced` text,
	`is_dirty` integer DEFAULT false,
	`is_deleted` integer DEFAULT false,
	FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON UPDATE no action ON DELETE no action
);
