ALTER TABLE `medications` ADD `directions` text;--> statement-breakpoint
ALTER TABLE `medications` ADD `side_effects` text;--> statement-breakpoint
ALTER TABLE `medications` ADD `purpose` text;--> statement-breakpoint
ALTER TABLE `medications` ADD `warnings` text;--> statement-breakpoint
ALTER TABLE `medications` ADD `dosage_amount` text NOT NULL;--> statement-breakpoint
ALTER TABLE `medications` ADD `dosage_unit` text NOT NULL;--> statement-breakpoint
ALTER TABLE `medications` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `medications` DROP COLUMN `dosage`;--> statement-breakpoint
ALTER TABLE `medications` DROP COLUMN `instructions`;