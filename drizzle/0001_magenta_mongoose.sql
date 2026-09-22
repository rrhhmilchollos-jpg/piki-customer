CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicCode` varchar(32) NOT NULL,
	`restaurantId` varchar(64) NOT NULL,
	`restaurantName` varchar(160) NOT NULL,
	`customerOpenId` varchar(64),
	`customerName` varchar(160),
	`address` text NOT NULL,
	`itemsJson` text NOT NULL,
	`totalCents` int NOT NULL,
	`status` enum('placed','accepted','ready','assigned','picked_up','delivering','delivered','cancelled') NOT NULL DEFAULT 'placed',
	`riderOpenId` varchar(64),
	`riderName` varchar(160),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_publicCode_unique` UNIQUE(`publicCode`)
);
--> statement-breakpoint
CREATE TABLE `partnerMenuItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`priceCents` int NOT NULL,
	`imageUrl` text,
	`available` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerMenuItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `partnerStores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`cuisine` varchar(80) NOT NULL,
	`address` text NOT NULL,
	`status` enum('pending_review','active','paused') NOT NULL DEFAULT 'pending_review',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `partnerStores_id` PRIMARY KEY(`id`)
);
