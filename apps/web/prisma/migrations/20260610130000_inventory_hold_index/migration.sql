-- Índice composto para agregações de holds activos sob carga

CREATE INDEX `InventoryHold_ticketLotId_status_expiresAt_idx`
  ON `InventoryHold`(`ticketLotId`, `status`, `expiresAt`);
