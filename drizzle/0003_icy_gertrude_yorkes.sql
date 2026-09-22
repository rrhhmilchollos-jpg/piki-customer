CREATE TABLE `passwordResetTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResetTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResetTokens_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','partner','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `email` varchar(320);--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `description` text;--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `coverImageUrl` text;--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `scheduleJson` text;--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `prepMinutes` int DEFAULT 20 NOT NULL;--> statement-breakpoint
ALTER TABLE `partnerStores` ADD `minimumOrderCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);