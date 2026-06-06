-- Personalização de faturas por organização e evento (MySQL/MariaDB)
ALTER TABLE `Organization` ADD COLUMN `invoiceThemeJson` JSON NULL;
ALTER TABLE `Event` ADD COLUMN `invoiceThemeJson` JSON NULL;
