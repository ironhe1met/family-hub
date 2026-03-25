-- ============================================================
-- Migration: Tasks — Kanban (is_done + list_name → status)
-- Запускать в SQL Editor Supabase
-- ============================================================

-- 1. Добавить колонку status
ALTER TABLE public.tasks
  ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
  CHECK (status IN ('new', 'in_progress', 'done', 'archived'));

-- 2. Бэкфилл существующих данных
UPDATE public.tasks SET status = CASE WHEN is_done THEN 'done' ELSE 'new' END;

-- 3. Удалить старые колонки
ALTER TABLE public.tasks DROP COLUMN is_done;
ALTER TABLE public.tasks DROP COLUMN list_name;

-- 4. Индекс для ускорения выборки по family + status
CREATE INDEX idx_tasks_family_status ON public.tasks (family_id, status);
