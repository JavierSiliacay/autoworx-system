-- Update existing expense records from 'Check' to 'Cheque'
UPDATE public.expenses 
SET type_of_payment = 'Cheque' 
WHERE type_of_payment = 'Check';
