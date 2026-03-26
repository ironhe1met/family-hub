-- Add description column to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
