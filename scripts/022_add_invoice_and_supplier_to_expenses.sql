-- Add invoice_number and supplier_name columns to the expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS invoice_number TEXT NULL,
ADD COLUMN IF NOT EXISTS supplier_name TEXT NULL;
