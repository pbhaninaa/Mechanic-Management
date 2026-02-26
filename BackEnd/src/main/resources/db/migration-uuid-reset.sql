-- UUID Migration Reset Script
-- Run this ONCE before starting the app after migrating from numeric IDs to UUIDs.
-- WARNING: This DROPS all data in mechdb. Use only for development or when a clean slate is acceptable.
--
-- To run: mysql -u root -p < src/main/resources/db/migration-uuid-reset.sql
-- Or from MySQL client: source /path/to/migration-uuid-reset.sql

DROP DATABASE IF EXISTS mechdb;
CREATE DATABASE mechdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
