-- Reestruturação de cargos (organização + plataforma)

-- Organização: migrar legados
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_OWNER' WHERE `role` = 'OWNER';
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_MANAGER' WHERE `role` = 'MANAGER';
UPDATE `OrganizationMember` SET `role` = 'PROMOTER_CHECKIN' WHERE `role` IN ('STAFF', 'PROMOTER_STAFF');

UPDATE `Invite` SET `role` = 'PROMOTER_OWNER' WHERE `role` = 'OWNER';
UPDATE `Invite` SET `role` = 'PROMOTER_MANAGER' WHERE `role` = 'MANAGER';
UPDATE `Invite` SET `role` = 'PROMOTER_CHECKIN' WHERE `role` IN ('STAFF', 'PROMOTER_STAFF');

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

-- Plataforma: remover PROMOTER / VALIDATOR globais
UPDATE `User` SET `role` = 'USER' WHERE `role` IN ('PROMOTER', 'VALIDATOR');

ALTER TABLE `User`
  MODIFY `role` ENUM('USER', 'ADMIN', 'FINANCE_MANAGER', 'SUPPORT_AGENT') NOT NULL DEFAULT 'USER';
