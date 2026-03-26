-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  ingredients  TEXT,
  instructions TEXT,
  image_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recipes_family ON public.recipes (family_id);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "recipes: family access" ON public.recipes FOR ALL
  USING (family_id = get_family_id()) WITH CHECK (family_id = get_family_id());

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
