CREATE TABLE `saved_states` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_key` text NOT NULL,
	`payload` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `saved_states_state_key_unique` ON `saved_states` (`state_key`);