-- RUN THIS QUERY IN YOUR SUPABASE SQL EDITOR
-- This adds the message_language column to the customers table.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS message_language VARCHAR(15) DEFAULT 'english' CHECK (message_language IN ('english', 'marathi'));
