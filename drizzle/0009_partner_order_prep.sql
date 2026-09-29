-- PIKI partner operations: persist the preparation time agreed at acceptance.
ALTER TABLE `orders` ADD `prepMinutes` int NULL;
