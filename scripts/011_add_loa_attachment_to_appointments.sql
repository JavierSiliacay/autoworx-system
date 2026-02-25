-- SQL Migration: Add loa_attachment column to appointments table
-- Run this in your Supabase SQL Editor

-- 1. Add column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS loa_attachment TEXT;

-- 2. Optional: Add column to appointment_history table if you want history tracking for LOA
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS loa_attachment TEXT;
