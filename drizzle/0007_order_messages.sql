CREATE TABLE `orderMessages` (
  `id` int AUTO_INCREMENT NOT NULL,
  `orderCode` varchar(32) NOT NULL,
  `senderOpenId` varchar(64) NOT NULL,
  `senderRole` enum('customer','rider') NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `orderMessages_id` PRIMARY KEY(`id`)
);
CREATE INDEX `orderMessages_orderCode_idx` ON `orderMessages` (`orderCode`);
