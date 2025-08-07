-- Migration: 001_add_missing_columns.sql
-- Description: Add missing columns to driver_assignments and shipments tables
-- Date: 2025-08-07
-- Author: System

-- Add missing columns to driver_assignments table
DO $$ 
BEGIN
    -- Check if acceptedAt column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'driver_assignments' 
        AND column_name = 'acceptedAt'
    ) THEN
        ALTER TABLE driver_assignments ADD COLUMN "acceptedAt" timestamp without time zone;
    END IF;

    -- Check if estimatedDuration column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'driver_assignments' 
        AND column_name = 'estimatedDuration'
    ) THEN
        ALTER TABLE driver_assignments ADD COLUMN "estimatedDuration" numeric(10,2);
    END IF;

    -- Check if actualDuration column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'driver_assignments' 
        AND column_name = 'actualDuration'
    ) THEN
        ALTER TABLE driver_assignments ADD COLUMN "actualDuration" numeric(10,2);
    END IF;
END $$;

-- Add missing columns to shipments table
DO $$ 
BEGIN
    -- Check if assignedDriverId column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' 
        AND column_name = 'assignedDriverId'
    ) THEN
        ALTER TABLE shipments ADD COLUMN "assignedDriverId" uuid;
    END IF;
END $$;

-- Create migration tracking table if it doesn't exist
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (migration_name) 
VALUES ('001_add_missing_columns.sql')
ON CONFLICT (migration_name) DO NOTHING;
