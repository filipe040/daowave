-- ============================================
-- Script Completo de Criação da Base de Dados
-- Plataforma de Bilhética - MariaDB/MySQL
-- Execute como root: mysql -u root -p < database.sql
-- ============================================

-- Criar base de dados
CREATE DATABASE IF NOT EXISTS ticketing
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ticketing;

-- Criar utilizador
CREATE USER IF NOT EXISTS 'ticketing'@'localhost' IDENTIFIED BY 'ticketing_dev_password';
GRANT ALL PRIVILEGES ON ticketing.* TO 'ticketing'@'localhost';
FLUSH PRIVILEGES;

-- ============================================
-- Tabelas
-- ============================================

-- Tabela: User
CREATE TABLE IF NOT EXISTS User (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('USER', 'PROMOTER', 'ADMIN') NOT NULL DEFAULT 'USER',
  emailVerified BOOLEAN NOT NULL DEFAULT FALSE,
  emailVerificationToken VARCHAR(255) NULL,
  emailVerificationTokenExpiresAt DATETIME(3) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_emailVerificationToken (emailVerificationToken),
  UNIQUE KEY idx_emailVerificationToken_unique (emailVerificationToken)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: PromoterProfile
CREATE TABLE IF NOT EXISTS PromoterProfile (
  id CHAR(36) NOT NULL PRIMARY KEY,
  userId CHAR(36) NOT NULL UNIQUE,
  companyName VARCHAR(255) NOT NULL,
  vat VARCHAR(50) NULL,
  contactEmail VARCHAR(255) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_userId (userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Event
CREATE TABLE IF NOT EXISTS Event (
  id CHAR(36) NOT NULL PRIMARY KEY,
  promoterId CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  venue VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  startAt DATETIME(3) NOT NULL,
  endAt DATETIME(3) NOT NULL,
  coverImage VARCHAR(500) NULL,
  status ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (promoterId) REFERENCES PromoterProfile(id) ON DELETE CASCADE,
  INDEX idx_slug (slug),
  INDEX idx_status (status),
  INDEX idx_promoterId (promoterId),
  INDEX idx_startAt (startAt),
  INDEX idx_city (city),
  INDEX idx_event_status_start (status, startAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: TicketLot
CREATE TABLE IF NOT EXISTS TicketLot (
  id CHAR(36) NOT NULL PRIMARY KEY,
  eventId CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  priceCents INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  quantityTotal INT NOT NULL,
  quantitySold INT NOT NULL DEFAULT 0,
  saleStartAt DATETIME(3) NOT NULL,
  saleEndAt DATETIME(3) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE CASCADE,
  INDEX idx_eventId (eventId),
  INDEX idx_saleDates (saleStartAt, saleEndAt),
  INDEX idx_ticket_lot_event_sale (eventId, saleStartAt, saleEndAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Order
CREATE TABLE IF NOT EXISTS `Order` (
  id CHAR(36) NOT NULL PRIMARY KEY,
  userId CHAR(36) NOT NULL,
  eventId CHAR(36) NOT NULL,
  totalCents INT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status ENUM('PENDING', 'PAID', 'CANCELED') NOT NULL DEFAULT 'PENDING',
  paymentProvider VARCHAR(50) NULL,
  paymentRef VARCHAR(255) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE RESTRICT,
  INDEX idx_userId (userId),
  INDEX idx_eventId (eventId),
  INDEX idx_status (status),
  INDEX idx_paymentRef (paymentRef),
  INDEX idx_createdAt (createdAt),
  INDEX idx_order_user_status (userId, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: OrderItem
CREATE TABLE IF NOT EXISTS OrderItem (
  id CHAR(36) NOT NULL PRIMARY KEY,
  orderId CHAR(36) NOT NULL,
  ticketLotId CHAR(36) NOT NULL,
  quantity INT NOT NULL,
  unitPriceCents INT NOT NULL,
  
  FOREIGN KEY (orderId) REFERENCES `Order`(id) ON DELETE CASCADE,
  FOREIGN KEY (ticketLotId) REFERENCES TicketLot(id) ON DELETE RESTRICT,
  INDEX idx_orderId (orderId),
  INDEX idx_ticketLotId (ticketLotId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: Ticket
CREATE TABLE IF NOT EXISTS Ticket (
  id CHAR(36) NOT NULL PRIMARY KEY,
  orderId CHAR(36) NOT NULL,
  eventId CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  ticketLotId CHAR(36) NOT NULL,
  code VARCHAR(100) NOT NULL UNIQUE,
  qrPayload TEXT NOT NULL,
  checkedInAt DATETIME(3) NULL,
  checkedInByUserId CHAR(36) NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  FOREIGN KEY (orderId) REFERENCES `Order`(id) ON DELETE CASCADE,
  FOREIGN KEY (eventId) REFERENCES Event(id) ON DELETE RESTRICT,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE RESTRICT,
  FOREIGN KEY (ticketLotId) REFERENCES TicketLot(id) ON DELETE RESTRICT,
  INDEX idx_orderId (orderId),
  INDEX idx_eventId (eventId),
  INDEX idx_userId (userId),
  INDEX idx_ticketLotId (ticketLotId),
  INDEX idx_code (code),
  INDEX idx_checkedInAt (checkedInAt),
  INDEX idx_ticket_event_user (eventId, userId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: AuditLog
CREATE TABLE IF NOT EXISTS AuditLog (
  id CHAR(36) NOT NULL PRIMARY KEY,
  actorUserId CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entityType VARCHAR(50) NOT NULL,
  entityId CHAR(36) NULL,
  metaJson JSON NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  
  INDEX idx_actorUserId (actorUserId),
  INDEX idx_entity (entityType, entityId),
  INDEX idx_createdAt (createdAt),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Triggers para Validações Automáticas
-- ============================================

-- Trigger: Validar stock e período de venda ao criar OrderItem
DROP TRIGGER IF EXISTS validate_ticket_lot_stock;
DELIMITER //
CREATE TRIGGER validate_ticket_lot_stock
BEFORE INSERT ON OrderItem
FOR EACH ROW
BEGIN
  DECLARE available_stock INT;
  DECLARE lot_sale_start DATETIME(3);
  DECLARE lot_sale_end DATETIME(3);
  DECLARE event_status VARCHAR(20);
  
  SELECT 
    (tl.quantityTotal - tl.quantitySold),
    tl.saleStartAt,
    tl.saleEndAt,
    e.status
  INTO available_stock, lot_sale_start, lot_sale_end, event_status
  FROM TicketLot tl
  INNER JOIN Event e ON e.id = tl.eventId
  WHERE tl.id = NEW.ticketLotId;
  
  IF event_status != 'PUBLISHED' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Event is not published';
  END IF;
  
  IF available_stock < NEW.quantity THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Insufficient stock for ticket lot';
  END IF;
  
  IF NOW() < lot_sale_start THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Sale has not started yet';
  END IF;
  
  IF NOW() > lot_sale_end THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Sale has ended';
  END IF;
END//
DELIMITER ;

-- Trigger: Atualizar quantitySold quando OrderItem é criado
DROP TRIGGER IF EXISTS update_ticket_lot_sold_on_order_item;
DELIMITER //
CREATE TRIGGER update_ticket_lot_sold_on_order_item
AFTER INSERT ON OrderItem
FOR EACH ROW
BEGIN
  UPDATE TicketLot
  SET quantitySold = quantitySold + NEW.quantity
  WHERE id = NEW.ticketLotId;
END//
DELIMITER ;

-- Trigger: Reverter quantitySold quando OrderItem é removido
DROP TRIGGER IF EXISTS revert_ticket_lot_sold_on_order_item_delete;
DELIMITER //
CREATE TRIGGER revert_ticket_lot_sold_on_order_item_delete
AFTER DELETE ON OrderItem
FOR EACH ROW
BEGIN
  UPDATE TicketLot
  SET quantitySold = GREATEST(0, quantitySold - OLD.quantity)
  WHERE id = OLD.ticketLotId;
END//
DELIMITER ;

-- ============================================
-- Views Úteis
-- ============================================

-- View: Eventos Publicados com Estatísticas
DROP VIEW IF EXISTS v_events_published;
CREATE VIEW v_events_published AS
SELECT 
  e.id,
  e.title,
  e.slug,
  e.city,
  e.startAt,
  e.endAt,
  e.status,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT t.id) as total_tickets,
  COALESCE(SUM(o.totalCents), 0) as total_revenue,
  COUNT(DISTINCT CASE WHEN t.checkedInAt IS NOT NULL THEN t.id END) as tickets_checked_in
FROM Event e
LEFT JOIN `Order` o ON o.eventId = e.id AND o.status = 'PAID'
LEFT JOIN Ticket t ON t.eventId = e.id
WHERE e.status = 'PUBLISHED'
GROUP BY e.id, e.title, e.slug, e.city, e.startAt, e.endAt, e.status;

-- View: Lotes Disponíveis
DROP VIEW IF EXISTS v_ticket_lots_available;
CREATE VIEW v_ticket_lots_available AS
SELECT 
  tl.*,
  e.title as event_title,
  e.slug as event_slug,
  (tl.quantityTotal - tl.quantitySold) as available_quantity,
  CASE 
    WHEN NOW() BETWEEN tl.saleStartAt AND tl.saleEndAt 
      AND (tl.quantityTotal - tl.quantitySold) > 0 
      AND e.status = 'PUBLISHED'
    THEN TRUE 
    ELSE FALSE 
  END as is_available
FROM TicketLot tl
INNER JOIN Event e ON e.id = tl.eventId;

-- ============================================
-- Stored Procedures
-- ============================================

-- Procedure: Verificar disponibilidade de lote
DROP PROCEDURE IF EXISTS sp_check_lot_availability;
DELIMITER //
CREATE PROCEDURE sp_check_lot_availability(
  IN p_ticket_lot_id CHAR(36),
  IN p_quantity INT,
  OUT p_available BOOLEAN,
  OUT p_message VARCHAR(255)
)
BEGIN
  DECLARE v_total INT;
  DECLARE v_sold INT;
  DECLARE v_sale_start DATETIME(3);
  DECLARE v_sale_end DATETIME(3);
  DECLARE v_event_status VARCHAR(20);
  
  SELECT 
    tl.quantityTotal,
    tl.quantitySold,
    tl.saleStartAt,
    tl.saleEndAt,
    e.status
  INTO v_total, v_sold, v_sale_start, v_sale_end, v_event_status
  FROM TicketLot tl
  INNER JOIN Event e ON e.id = tl.eventId
  WHERE tl.id = p_ticket_lot_id;
  
  IF v_event_status != 'PUBLISHED' THEN
    SET p_available = FALSE;
    SET p_message = 'Event is not published';
  ELSEIF NOW() < v_sale_start THEN
    SET p_available = FALSE;
    SET p_message = 'Sale has not started yet';
  ELSEIF NOW() > v_sale_end THEN
    SET p_available = FALSE;
    SET p_message = 'Sale has ended';
  ELSEIF (v_total - v_sold) < p_quantity THEN
    SET p_available = FALSE;
    SET p_message = 'Insufficient tickets available';
  ELSE
    SET p_available = TRUE;
    SET p_message = 'Available';
  END IF;
END//
DELIMITER ;

-- ============================================
-- Fim do Script
-- ============================================

SELECT '✓ Database ticketing created successfully!' as message;
SELECT '✓ User ticketing@localhost created' as message;
SELECT '✓ All tables, triggers, views and procedures created' as message;
SELECT '' as message;
SELECT 'Next steps:' as message;
SELECT '1. Update .env with: DATABASE_URL="mysql://ticketing:ticketing_dev_password@localhost:3306/ticketing"' as message;
SELECT '2. Run: npx prisma generate' as message;
SELECT '3. (Opcional) Execute o script de seed do projeto se existir.' as message;
