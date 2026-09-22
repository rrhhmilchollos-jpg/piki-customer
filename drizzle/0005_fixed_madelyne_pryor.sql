CREATE TABLE `riderDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderOpenId` varchar(64) NOT NULL,
	`type` enum('dni','driver_license','insurance') NOT NULL,
	`status` enum('pending','verified','rejected','expired') NOT NULL DEFAULT 'pending',
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`expiresAt` timestamp,
	`reviewedByOpenId` varchar(64),
	`reviewedAt` timestamp,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riderDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riderLocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderOpenId` varchar(64) NOT NULL,
	`latitudeE6` int NOT NULL,
	`longitudeE6` int NOT NULL,
	`accuracyMeters` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `riderLocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sosAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderOpenId` varchar(64) NOT NULL,
	`orderCode` varchar(32),
	`latitudeE6` int,
	`longitudeE6` int,
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`note` text,
	`acknowledgedByOpenId` varchar(64),
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sosAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryVerificationState` enum('pending','confirmed','failed') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryPinAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `lastLocationAt` timestamp;