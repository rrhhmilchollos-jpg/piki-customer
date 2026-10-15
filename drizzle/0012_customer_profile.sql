-- Perfil Customer operativo: contacto y dirección validada para pedidos y soporte.
ALTER TABLE `users` ADD COLUMN `phone` varchar(32) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `address` text NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `locality` varchar(120) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `deliveryLatitude` varchar(32) NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `deliveryLongitude` varchar(32) NULL;
