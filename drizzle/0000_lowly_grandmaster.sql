CREATE TABLE `trips` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`trip_json` text NOT NULL,
	`created_at` text NOT NULL,
	`is_saved` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `trips_owner_created_idx` ON `trips` (`owner_id`,`created_at`);