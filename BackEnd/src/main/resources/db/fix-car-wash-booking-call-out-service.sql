-- Fix: Field 'call out service' doesn't have a default value
-- Your table has an extra column with a space in the name. The app uses call_out_service.
-- Run ONE of the blocks below in MySQL (USE mechdb; first). If you get "Unknown column", try the next.
--
-- From BackEnd folder: mysql -u root -p mechdb < src/main/resources/db/fix-car-wash-booking-call-out-service.sql

USE mechdb;

-- If the table has BOTH "Call Out Service" and call_out_service: drop the old one with the space.
ALTER TABLE car_wash_booking DROP COLUMN `Call Out Service`;

-- If that fails with "Unknown column 'Call Out Service'", try lowercase:
-- ALTER TABLE car_wash_booking DROP COLUMN `call out service`;

-- Then ensure call_out_service has a default so inserts never fail:
ALTER TABLE car_wash_booking MODIFY COLUMN call_out_service BIT(1) NOT NULL DEFAULT 0;
