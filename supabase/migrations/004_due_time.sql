-- Add due_time column to tasks (stores "HH:MM" string)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_time TEXT;
