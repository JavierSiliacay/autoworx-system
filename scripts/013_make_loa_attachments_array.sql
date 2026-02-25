-- FIXED SQL Migration: Unlimited LOA Attachments
-- This version handles the case where loa_attachment_2 might be missing.
-- Run this in your Supabase SQL Editor

-- 1. Ensure columns exist before migration
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS loa_attachment_2 TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS loa_attachments TEXT[] DEFAULT '{}';

ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS loa_attachment_2 TEXT;
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS loa_attachments TEXT[] DEFAULT '{}';

-- 2. Migrate existing data from single/double columns to the array
-- This uses ARRAY_REMOVE(..., NULL) to clean up empty slots
UPDATE appointments 
SET loa_attachments = ARRAY_REMOVE(ARRAY[loa_attachment, loa_attachment_2], NULL)
WHERE loa_attachment IS NOT NULL OR loa_attachment_2 IS NOT NULL;

UPDATE appointment_history
SET loa_attachments = ARRAY_REMOVE(ARRAY[loa_attachment, loa_attachment_2], NULL)
WHERE loa_attachment IS NOT NULL OR loa_attachment_2 IS NOT NULL;

-- 3. (Optional) Cleanup - you can run these AFTER you verify the array works in the app
-- ALTER TABLE appointments DROP COLUMN IF EXISTS loa_attachment;
-- ALTER TABLE appointments DROP COLUMN IF EXISTS loa_attachment_2;
