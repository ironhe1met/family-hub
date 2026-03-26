-- Purchase lists (persist empty lists)
CREATE TABLE IF NOT EXISTS public.purchase_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, name)
);
ALTER TABLE public.purchase_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "purchase_lists: family access" ON public.purchase_lists FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- Migrate existing list names
INSERT INTO public.purchase_lists (family_id, name, sort_order)
SELECT DISTINCT family_id, list_name, 0 FROM public.purchases
ON CONFLICT (family_id, name) DO NOTHING;

-- Task lists
CREATE TABLE IF NOT EXISTS public.task_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(family_id, name)
);
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "task_lists: family access" ON public.task_lists FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- Add list_name to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS list_name TEXT DEFAULT 'Загальні';

-- Create default task list for existing families
INSERT INTO public.task_lists (family_id, name, sort_order)
SELECT DISTINCT family_id, 'Загальні', 0 FROM public.tasks
ON CONFLICT (family_id, name) DO NOTHING;

-- Realtime for new tables
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.purchase_lists; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.task_lists; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
