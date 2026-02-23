-- Add service_advisor field to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_advisor TEXT;

-- Add service_advisor field to appointment_history table
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS service_advisor TEXT;
