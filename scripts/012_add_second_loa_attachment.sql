-- SQL Migration: Add loa_attachment_2 column to appointments table
-- Run this in your Supabase SQL Editor

-- 1. Add column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS loa_attachment_2 TEXT;

-- 2. Add column to appointment_history table
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS loa_attachment_2 TEXT;
