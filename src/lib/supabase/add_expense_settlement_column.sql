-- RUN THIS QUERY IN YOUR SUPABASE SQL EDITOR
-- This updates the expenses table to support customer credit settlements.

-- 1. Drop the existing category check constraint if it exists
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- 2. Re-create the category check constraint with 'customer_credit_settlement' included
ALTER TABLE public.expenses ADD CONSTRAINT expenses_category_check 
  CHECK (category IN ('feed', 'transport', 'equipment', 'salary', 'maintenance', 'veterinary', 'other', 'customer_credit_settlement'));

-- 3. Add a customer_id column to the expenses table to link settlements to specific customers
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
