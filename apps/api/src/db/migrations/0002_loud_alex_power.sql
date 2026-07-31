CREATE TABLE `calendar_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`range_start` text NOT NULL,
	`range_end` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_snapshot_user_range_idx` ON `calendar_snapshot` (`user_id`,`range_start`,`range_end`);