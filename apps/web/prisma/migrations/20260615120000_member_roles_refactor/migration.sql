-- Reestruturação de cargos (organização + plataforma)
-- MySQL/MariaDB: expandir ENUM antes de UPDATE (evita error 1265 "Data truncated")

-- 1) Expandir ENUMs de organização (valores novos + legados)
ALTER TABLE `OrganizationMember`
  MODIFY `role` ENUM(
    'PROMOTER_OWNER',
    'PROMOTER_MANAGER',
    'PROMOTER_STAFF',
    'PROMOTER_FINANCE',
    'PROMOTER_CASHIER',
    'PROMOTER_CHECKIN',
    'READ_ONLY',
    'OWNER',
    'MANAGER',
    'STAFF'
  ) NOT NULL DEFAULT 'PROMOTER_STAFF';

ALTER TABLE `Invite`
  MODIFY `role` ENUM(
    'PROMOTER_OWNER',
    'PROMOTER_MANAGER',
    'PROMOTER_STAFF',
    'PROMOTER_FINANCE',
    'PROMOTER_CASHIER',
    'PROMOTER_CHECKIN',
    'READ_ONLY',
    'OWNER',
    'MANAGER',
    'STAFF'
  ) NOT NULL;

-- 2) Migrar dados legados
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_OWNER' WHERE `role` = 'OWNER';
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_MANAGER' WHERE `role` = 'MANAGER';
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_CHECKIN' WHERE `role` IN ('STAFF', 'PROMOTER_STAFF');

UPDATE `Invite` SET `role` = 'PROMOTER_OWNER' WHERE `role` = 'OWNER';
UPDATE `Invite` SET `role` = 'PROMOTER_MANAGER' WHERE `role` = 'MANAGER';
UPDATE `Invite` SET `role` = 'PROMOTER_CHECKIN' WHERE `role` IN ('STAFF', 'PROMOTER_STAFF');

-- 3) Reduzir ENUMs de organização ao conjunto final
ALTER TABLE `OrganizationMember`
  MODIFY `role` ENUM(
    'PROMOTER_OWNER',
    'PROMOTER_MANAGER',
    'PROMOTER_FINANCE',
    'PROMOTER_CASHIER',
    'PROMOTER_CHECKIN',
    'READ_ONLY'
  ) NOT NULL DEFAULT 'PROMOTER_CHECKIN';

ALTER TABLE `Invite`
  MODIFY `role` ENUM(
    'PROMOTER_OWNER',
    'PROMOTER_MANAGER',
    'PROMOTER_FINANCE',
    'PROMOTER_CASHIER',
    'PROMOTER_CHECKIN',
    'READ_ONLY'
  ) NOT NULL;

-- 4) Plataforma: expandir ENUM, migrar PROMOTER/VALIDATOR → USER, reduzir
ALTER TABLE `User`
  MODIFY `role` ENUM(
    'USER',
    'ADMIN',
    'PROMOTER',
    'VALIDATOR',
    'FINANCE_MANAGER',
    'SUPPORT_AGENT'
  ) NOT NULL DEFAULT 'USER';

UPDATE `User` SET `role` = 'USER' WHERE `role` IN ('PROMOTER', 'VALIDATOR');

ALTER TABLE `User`
  MODIFY `role` ENUM(
    'USER',
    'ADMIN',
    'FINANCE_MANAGER',
    'SUPPORT_AGENT'
  ) NOT NULL DEFAULT 'USER';
