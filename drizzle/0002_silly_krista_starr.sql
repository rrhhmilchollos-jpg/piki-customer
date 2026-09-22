CREATE TABLE `paymentEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stripeEventId` varchar(255) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`orderCode` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentEvents_stripeEventId_unique` UNIQUE(`stripeEventId`)
);
--> statement-breakpoint
CREATE TABLE `riderProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderOpenId` varchar(64) NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`vehicle` enum('bike','moto','car') NOT NULL DEFAULT 'bike',
	`availability` enum('offline','available','busy') NOT NULL DEFAULT 'offline',
	`zone` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riderProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `riderProfiles_riderOpenId_unique` UNIQUE(`riderOpenId`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentState` enum('pending','paid','failed','refunded') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `stripeCheckoutSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` ADD `stripePaymentIntentId` varchar(255);