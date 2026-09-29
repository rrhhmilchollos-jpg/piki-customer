-- PIKI Partners: native SUNMI/FCM devices and browser Web Push fallback.
CREATE TABLE `partnerPushSubscriptions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerOpenId` varchar(64) NOT NULL,
  `storeId` int NOT NULL,
  `installationId` varchar(128) NOT NULL,
  `transport` enum('web_push','fcm') NOT NULL,
  `token` varchar(1024) NOT NULL,
  `p256dh` varchar(255),
  `auth` varchar(255),
  `alertEnabled` int NOT NULL DEFAULT 1,
  `lastSeenAt` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `partnerPushSubscriptions_id` PRIMARY KEY (`id`),
  CONSTRAINT `partnerPushSubscriptions_token_unique` UNIQUE (`token`),
  INDEX `partnerPushSubscriptions_store_alert_idx` (`storeId`, `alertEnabled`)
);
