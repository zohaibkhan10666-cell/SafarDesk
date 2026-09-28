-- 0002_plan_catalog.sql — plan catalog columns (Super Admin plan management, README §19.1)
-- Companion to 0001_init.sql. Safe to re-run: every statement checks the column first.

ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "storageGB" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "allowedRoles" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
