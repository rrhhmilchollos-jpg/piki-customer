-- Trazabilidad de la primera/última visualización de documentos rider desde Operaciones.
ALTER TABLE `riderDocuments` ADD COLUMN `viewedByOpenId` varchar(64);
--> statement-breakpoint
ALTER TABLE `riderDocuments` ADD COLUMN `viewedAt` timestamp;
