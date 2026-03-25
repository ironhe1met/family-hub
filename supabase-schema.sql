-- ============================================================
-- Family Planner — Supabase Schema (MVP 1.0)
-- Запускать в SQL Editor вашего Supabase-проекта
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. profiles
-- Расширяет auth.users, хранит принадлежность к семье
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id    UUID NOT NULL,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Пользователь видит/редактирует только свой профиль
CREATE POLICY "profiles: own row"
  ON public.profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Вспомогательная функция: получить family_id текущего юзера
-- (создаётся ПОСЛЕ таблицы profiles)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_family_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT family_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ────────────────────────────────────────────────────────────
-- 2. purchases (Список покупок)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.purchases (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  list_name  TEXT NOT NULL DEFAULT 'Общий',   -- название магазина/категории
  name       TEXT NOT NULL,
  quantity   TEXT,
  is_bought  BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchases: family access"
  ON public.purchases
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- ────────────────────────────────────────────────────────────
-- 3. tasks (Дела / To-Do)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL,
  description TEXT NOT NULL,
  is_done     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: family access"
  ON public.tasks
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- ────────────────────────────────────────────────────────────
-- 4. projects (Проекты)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID NOT NULL,
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: family access"
  ON public.projects
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- ────────────────────────────────────────────────────────────
-- 5. project_items (Элементы проекта)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.project_items (
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

CREATE POLICY "project_items: family access"
  ON public.project_items
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- ────────────────────────────────────────────────────────────
-- 6. ideas (Идеи / Бэклог)
-- ────────────────────────────────────────────────────────────
CREATE TABLE public.ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ideas: family access"
  ON public.ideas
  FOR ALL
  USING (family_id = get_family_id())
  WITH CHECK (family_id = get_family_id());

-- ────────────────────────────────────────────────────────────
-- Включить Realtime для всех таблиц с данными
-- ────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ideas;

-- ────────────────────────────────────────────────────────────
-- Автоматическое создание профиля при регистрации
-- Вызывается trigger'ом при INSERT в auth.users
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, family_id, display_name)
  VALUES (
    NEW.id,
    -- family_id берётся из user_metadata, если передан при создании пользователя,
    -- иначе создаётся новый UUID (для первого члена семьи)
    COALESCE((NEW.raw_user_meta_data->>'family_id')::UUID, gen_random_uuid()),
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
