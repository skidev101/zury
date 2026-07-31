CREATE TABLE `calendar_pending_intent` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`conversation_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversation`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_pending_intent_conversation_idx` ON `calendar_pending_intent` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `calendar_pending_intent_user_expiry_idx` ON `calendar_pending_intent` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE TABLE `github_activity_snapshot` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`repository_id` text NOT NULL,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_activity_user_repo_idx` ON `github_activity_snapshot` (`user_id`,`repository_id`);--> statement-breakpoint
CREATE TABLE `github_authorization_state` (
	`id` text PRIMARY KEY NOT NULL,
	`state_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_authorization_state_state_hash_unique` ON `github_authorization_state` (`state_hash`);--> statement-breakpoint
CREATE INDEX `github_authorization_state_expiry_idx` ON `github_authorization_state` (`expires_at`);--> statement-breakpoint
CREATE TABLE `github_connection` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL,
	`access_token` text NOT NULL,
	`connected_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_connection_user_idx` ON `github_connection` (`user_id`);--> statement-breakpoint
CREATE TABLE `github_repository` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`external_id` text NOT NULL,
	`name` text NOT NULL,
	`full_name` text NOT NULL,
	`selected` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_repository_user_external_idx` ON `github_repository` (`user_id`,`external_id`);