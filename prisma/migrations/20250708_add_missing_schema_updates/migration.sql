-- Migration to add missing schema fields and enums
-- This migration is safe to run multiple times

-- Add missing enums if they don't exist
DO $$ BEGIN
    CREATE TYPE "DepartmentRole" AS ENUM ('CAPO_REPARTO', 'CAPO_TURNO', 'OPERATORE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing enums
DO $$ BEGIN
    -- Update DepartmentType enum
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'HONEYCOMB';
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'CONTROLLO_NUMERICO';
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'MONTAGGIO';
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'VERNICIATURA';
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'MOTORI';
    ALTER TYPE "DepartmentType" ADD VALUE IF NOT EXISTS 'CONTROLLO_QUALITA';
    
    -- Update ODLStatus enum  
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_HONEYCOMB';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'HONEYCOMB_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'CONTROLLO_NUMERICO_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_CONTROLLO_NUMERICO';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_MONTAGGIO';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'MONTAGGIO_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'NDI_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_VERNICIATURA';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'VERNICIATURA_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_MOTORI';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'MOTORI_COMPLETED';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'IN_CONTROLLO_QUALITA';
    ALTER TYPE "ODLStatus" ADD VALUE IF NOT EXISTS 'CONTROLLO_QUALITA_COMPLETED';
    
    -- Update LoadStatus enum
    ALTER TYPE "LoadStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
    ALTER TYPE "LoadStatus" ADD VALUE IF NOT EXISTS 'READY';
    ALTER TYPE "LoadStatus" ADD VALUE IF NOT EXISTS 'IN_CURE';
    ALTER TYPE "LoadStatus" ADD VALUE IF NOT EXISTS 'RELEASED';
EXCEPTION
    WHEN others THEN null;
END $$;

-- Add missing columns to users table if they don't exist
DO $$ BEGIN
    -- Add departmentId column
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "departmentId" TEXT;
    
    -- Add departmentRole column
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "departmentRole" "DepartmentRole";
    
    -- Add settings column (the key fix for authentication)
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" JSONB;
    
EXCEPTION
    WHEN others THEN null;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" 
    FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS "users_departmentId_departmentRole_idx" ON "users"("departmentId", "departmentRole");