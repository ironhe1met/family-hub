-- Initial schema: profiles, purchases, tasks, projects, project_items, ideas
-- Already applied manually. This file exists for reference only.

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id    UUID NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "profiles: own row" ON public.profiles FOR ALL
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION get_family_id() RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid();
$$;

-- purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  list_name  TEXT NOT NULL DEFAULT 'Загальні',
  name       TEXT NOT NULL,
  quantity   TEXT,
  is_bought  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "purchases: family access" ON public.purchases FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- tasks (base)
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL,
  name        TEXT NOT NULL,
  due_date    DATE,
  priority    TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'done', 'archived')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_family_status ON public.tasks (family_id, status);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "tasks: family access" ON public.tasks FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- projects
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "projects: family access" ON public.projects FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- project_items
CREATE TABLE IF NOT EXISTS public.project_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  family_id      UUID NOT NULL,
  name           TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'done')),
  estimated_cost NUMERIC(12, 2),
  currency       TEXT CHECK (currency IN ('UAH', 'USD')),
  url            TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.project_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "project_items: family access" ON public.project_items FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- ideas
CREATE TABLE IF NOT EXISTS public.ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "ideas: family access" ON public.ideas FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

-- Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_items;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, family_id, display_name)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'family_id')::UUID, gen_random_uuid()), NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
