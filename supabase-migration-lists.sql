-- Migration: Add purchase_lists and task_lists tables
-- Run this in Supabase SQL Editor

-- 1. Purchase lists (persist empty lists)
CREATE TABLE IF NOT EXISTS public.purchase_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, name)
);

ALTER TABLE public.purchase_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_lists: family access"
  ON public.purchase_lists
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- Migrate existing list names into purchase_lists
INSERT INTO public.purchase_lists (family_id, name, sort_order)
SELECT DISTINCT family_id, list_name, 0
FROM public.purchases
ON CONFLICT (family_id, name) DO NOTHING;

-- 2. Task lists
CREATE TABLE IF NOT EXISTS public.task_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, name)
);

ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_lists: family access"
  ON public.task_lists
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- 3. Add list_name column to tasks (nullable for backwards compat)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS list_name TEXT DEFAULT 'Загальні';

-- Create a default task list for each existing family
INSERT INTO public.task_lists (family_id, name, sort_order)
SELECT DISTINCT family_id, 'Загальні', 0
FROM public.tasks
ON CONFLICT (family_id, name) DO NOTHING;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_lists;
