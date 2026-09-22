CREATE TABLE `deliveryIncidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderCode` varchar(32),
	`type` enum('delay','address','safety','customer','other') NOT NULL,
	`status` enum('open','in_review','resolved') NOT NULL DEFAULT 'open',
	`notes` text NOT NULL,
	`reporterOpenId` varchar(64) NOT NULL,
	`assignedOpenId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryIncidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveryZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`city` varchar(120) NOT NULL,
	`managerOpenId` varchar(64),
	`status` enum('active','paused') NOT NULL DEFAULT 'active',
	`baseFeeCents` int NOT NULL DEFAULT 199,
	`riderPayoutCents` int NOT NULL DEFAULT 350,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveryZones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fleets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`zoneId` int NOT NULL,
	`managerOpenId` varchar(64),
	`contactPhone` varchar(32),
	`status` enum('pending','active','paused') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fleets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opsAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorOpenId` varchar(64) NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(64) NOT NULL,
	`detailJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `opsAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','partner','rider','fleet_manager','zone_manager','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `status` enum('pending','active','suspended') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `documentsStatus` enum('pending','verified','rejected','expired') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `fleetId` int;--> statement-breakpoint
ALTER TABLE `riderProfiles` ADD `earningsCents` int DEFAULT 0 NOT NULL;