-- PIKI: standardize delivery fees at 2.99 EUR for existing and future zones.
UPDATE `deliveryZones` SET `baseFeeCents` = 299 WHERE `baseFeeCents` = 199;
--> statement-breakpoint
ALTER TABLE `deliveryZones` MODIFY COLUMN `baseFeeCents` int NOT NULL DEFAULT 299;
