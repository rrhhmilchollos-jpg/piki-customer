CREATE TABLE `riderPushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riderOpenId` varchar(64) NOT NULL,
	`endpoint` varchar(1024) NOT NULL,
	`p256dh` varchar(255) NOT NULL,
	`auth` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riderPushSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `riderPushSubscriptions_endpoint_unique` UNIQUE(`endpoint`)
);
