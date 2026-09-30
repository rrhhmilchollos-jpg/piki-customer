ALTER TABLE `orders` ADD `paymentMethod` enum('stripe','cash') NOT NULL DEFAULT 'stripe' AFTER `paymentState`;
