-- Migration: Initial schema
-- Schema Version: 0 → 1
-- Type: automatic (initial setup)
-- Generated: 2026-01-29

-- Category table
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Customer table
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "source" TEXT,
  "invoiceCompany" TEXT,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Customer_categoryId_idx" ON "Customer"("categoryId");
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");

-- Transaction table
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "profit" REAL NOT NULL DEFAULT 0,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "Transaction_customerId_idx" ON "Transaction"("customerId");

-- OrderItem table (without isPaid - that comes in v2)
CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "route" TEXT NOT NULL,
  "ticketNumber" TEXT,
  "amount" REAL NOT NULL,
  "invoiceCompany" TEXT,
  "date" TEXT,
  "comment" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "OrderItem_transactionId_idx" ON "OrderItem"("transactionId");
CREATE INDEX IF NOT EXISTS "OrderItem_route_idx" ON "OrderItem"("route");
CREATE INDEX IF NOT EXISTS "OrderItem_ticketNumber_idx" ON "OrderItem"("ticketNumber");
CREATE INDEX IF NOT EXISTS "OrderItem_invoiceCompany_idx" ON "OrderItem"("invoiceCompany");

-- SchemaVersion table for tracking migrations
CREATE TABLE IF NOT EXISTS "SchemaVersion" (
  "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
  "version" INTEGER NOT NULL UNIQUE,
  "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL
);

-- Record this migration
INSERT OR IGNORE INTO "SchemaVersion" ("id", "version", "name", "appliedAt")
VALUES (1, 1, 'Initial schema', CURRENT_TIMESTAMP);
