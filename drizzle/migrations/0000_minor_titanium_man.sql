CREATE TABLE `categories` (
	`name` text NOT NULL,
	`label` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`isCustom` integer DEFAULT true NOT NULL,
	`type` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	PRIMARY KEY(`name`, `type`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`date_time` integer NOT NULL,
	`description` text,
	`payment_method` text,
	`category` text NOT NULL,
	`receipt` text,
	`currency` text DEFAULT 'INR' NOT NULL,
	`is_trashed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `incomes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`amount` real NOT NULL,
	`date_time` integer NOT NULL,
	`description` text,
	`source` text NOT NULL,
	`receipt` text,
	`currency` text DEFAULT 'INR' NOT NULL,
	`is_trashed` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
