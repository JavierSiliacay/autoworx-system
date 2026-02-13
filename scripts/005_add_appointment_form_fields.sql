-- Add new fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS assignee_driver TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS chassis_number TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS engine_number TEXT;

-- Add new fields to appointment_history table
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS assignee_driver TEXT;
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS vehicle_color TEXT;
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS chassis_number TEXT;
ALTER TABLE appointment_history ADD COLUMN IF NOT EXISTS engine_number TEXT;
