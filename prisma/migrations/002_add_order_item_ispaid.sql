-- Migration: Add payment tracking to OrderItem level
-- Schema Version: 1 → 2
-- Type: automatic (additive change)
-- Generated: 2026-01-29

-- Add isPaid column to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN "isPaid" INTEGER NOT NULL DEFAULT 0;

-- Create index for isPaid column (for filtering paid/unpaid items)
CREATE INDEX IF NOT EXISTS "OrderItem_isPaid_idx" ON "OrderItem"("isPaid");

-- Record this migration
INSERT OR IGNORE INTO "SchemaVersion" ("version", "name", "appliedAt")
VALUES (2, 'Add payment tracking to OrderItem level', CURRENT_TIMESTAMP);
