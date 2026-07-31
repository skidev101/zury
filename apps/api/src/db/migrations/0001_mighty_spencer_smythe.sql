CREATE TABLE `calendar_authorization_state` (
	`id` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_authorization_state_state_hash_unique` ON `calendar_authorization_state` (`state_hash`);--> statement-breakpoint
CREATE INDEX `calendar_authorization_state_user_idx` ON `calendar_authorization_state` (`user_id`);--> statement-breakpoint
CREATE INDEX `calendar_authorization_state_expiry_idx` ON `calendar_authorization_state` (`expires_at`);--> statement-breakpoint
CREATE TABLE `calendar_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`access_token_expires_at` integer,
	`scope` text NOT NULL,
	`connected_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_connection_user_provider_idx` ON `calendar_connection` (`user_id`,`provider`);--> statement-breakpoint
CREATE INDEX `calendar_connection_user_id_idx` ON `calendar_connection` (`user_id`);--> statement-breakpoint
CREATE TABLE `calendar_event_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`external_event_id` text NOT NULL,
	`calendar_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`location` text,
	`start_at` text NOT NULL,
	`end_at` text NOT NULL,
	`all_day` integer NOT NULL,
	`status` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_event_user_external_idx` ON `calendar_event_snapshot` (`user_id`,`calendar_id`,`external_event_id`);--> statement-breakpoint
CREATE INDEX `calendar_event_user_range_idx` ON `calendar_event_snapshot` (`user_id`,`start_at`,`end_at`);