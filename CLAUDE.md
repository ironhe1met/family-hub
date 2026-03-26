# Family Web Planner — Single Source of Truth

## Роль AI
Ты — Senior Full-Stack разработчик. Создаешь закрытое веб-приложение для семьи.
Делай максимально простой, читаемый и рабочий код. Не пиши код "на будущее".
Жди команды пользователя для перехода к каждому следующему этапу.

---
## 0. СУВОРІ ПРАВИЛА РОБОТИ (GUARDRAILS)
- **Заборона на редизайн:** НІКОЛИ не змінюй існуючі стилі, відступи або кольори, якщо про це не було прямої вказівки.
- **Локальні зміни:** Якщо я прошу змінити дизайн конкретного елемента — міняй ТІЛЬКИ його. Не чіпай сусідні модулі.
- **Збереження функціоналу:** При рефакторингу стилів стеж, щоб кнопки (FAB, Delete, Edit) залишалися на місці.
- **Колірна стабільність:** Використовуй тільки затверджену палітру. Жодного рандому.
- **Автозакриття вікон:** Модальні вікна (Dialog) ЗАВЖДИ закриваються автоматично після успішного Submit. Виклик: `onSubmit()` → `onClose()`.
- **Сувора геометрія:** `rounded-sm`/`rounded-md` для всіх елементів. `rounded-full` — ТІЛЬКИ для кнопки Save/Submit. Див. розділ 0.2.

### 0.1 ТИПОГРАФІКА
| Правило | Деталі |
|---------|--------|
| **Шрифт** | Inter (Google Fonts), fallback: `ui-sans-serif, system-ui, sans-serif`. Без засічок (serif) — заборонено |
| **Підключення** | `next/font/google` → `Inter`, subsets: `['latin', 'cyrillic']`, variable: `--font-inter` |
| **Базовий розмір** | `text-[15px]` на `<body>` (~+10% від стандартних 14px) |
| **Заголовки** | `text-lg font-medium` (модальні), `text-base font-medium` (секції) |
| **Підписи/лейбли** | `text-xs font-medium text-muted-foreground` |
| **Тіло тексту** | `text-sm` (елементи списку), `text-[15px]` (основний контент) |

### 0.2 ГЕОМЕТРІЯ (Google Workspace style)
| Елемент | Скруглення | Деталі |
|---------|------------|--------|
| **Кнопка Save/Submit** | `rounded-full` | ЄДИНИЙ елемент з pill-формою |
| **FAB** | `rounded-xl` | Квадратна з м'якими кутами |
| **Діалог (Dialog)** | `rounded-lg` | Строгий прямокутник |
| **Картки/плитки** | `rounded-md` | Мінімальне скруглення |
| **Інпути, textarea, select** | `rounded-md` | Квадратні поля |
| **Таби/вкладки** | `rounded-md` | Прямокутні, НЕ pill |
| **Чекбокси** | `rounded-[3px]` | Майже квадратні |
| **Бейджі** | `rounded-sm` | Компактні прямокутники |
| **Kanban колонки** | `rounded-md` | Строгі контейнери |
| **Scroll-контейнери табів** | — | `overflow-x-auto px-2 py-1.5 -my-1.5` — padding для glow, щоб не обрізалось |
| **Заборона** | — | `rounded-full`, `rounded-2xl`, `rounded-3xl` заборонені для інпутів, карток, табів |

### 0.3 МОДАЛЬНІ ВІКНА (Dialog)
| Правило | Деталі |
|---------|--------|
| **Контейнер** | `rounded-lg bg-surface-container-high p-6 shadow-2xl max-w-md` |
| **Назва** | `text-xl font-medium bg-transparent border-b-2 border-outline-variant/30 focus:border-primary` |
| **Поля** | `h-11 rounded-md bg-surface-container-high` з іконкою зліва |
| **Кнопки** | Cancel: `rounded-md` ghost. Submit: `rounded-full bg-primary` pill |

### 0.4 ПРАВИЛА КОНСИСТЕНТНОСТІ (Glowing Purple)
| Правило | Деталі |
|---------|--------|
| **Єдиний акцент** | Усі інтерактивні елементи — Glowing Purple (`--primary`) |
| **Інпути** | `h-11 rounded-md bg-surface-container-high hover:bg-surface-container-highest` |
| **Таби** | `rounded-md`, активний: `bg-primary/15 text-primary`, неактивний: `text-muted-foreground hover:bg-primary/8` |
| **Бейджі** | `rounded-sm px-2 text-[11px]` |
| **Hover** | `hover:bg-primary/10` або `hover:bg-surface-container-highest`. НІКОЛИ hover:text-foreground |
| **Glow** | Тільки FAB та Save кнопка: `glow-primary` |

## 1. ТЕКУЩИЙ СТАТУС

| Модуль | Статус | Описание |
|--------|--------|----------|
| Auth | Done | Email/Password через Supabase, auto-створення профілю з family_id, Logout |
| Layout | Done | Mobile-first, Header з TopNav (5 вкладок), профіль з аватаром, Dark/Light toggle |
| Покупки | Done | Списки, CRUD, чекбокс, Undo-видалення, Optimistic UI, Realtime |
| Завдання | Done | Kanban + List, Drag & Drop, пріоритети, дедлайни + час, списки завдань, Realtime |
| Рецепти | Placeholder | Сторінка-заглушка, чекає Етап 6 |
| Проєкти | Placeholder | Сторінка-заглушка, чекає Етап 8 |
| Ідеї | Placeholder | Сторінка-заглушка, чекає Етап 7 |
| Deploy | Done | Production на home.ironhelmet.com.ua, PM2 process manager |

### Supabase
- Таблицы: `profiles`, `purchases`, `tasks`, `projects`, `project_items`, `ideas`
- RLS включен на всех таблицах, фильтрация через `get_family_id()`
- Realtime включен для всех таблиц с данными
- Схема: `supabase-schema.sql`, миграция: `supabase-migration-kanban.sql`

### Структура маршрутов
```
(auth)/login     — сторінка входу
(app)/purchases  — модуль покупок
(app)/tasks      — модуль завдань (Kanban + List)
(app)/recipes    — модуль рецептів (placeholder)
(app)/projects   — модуль проєктів (placeholder)
(app)/ideas      — модуль ідей (placeholder)
```

---

## 2. DESIGN SYSTEM (Material Design 3)

Все модули ОБЯЗАНЫ следовать этим правилам. При создании нового компонента — сверяйся с этим разделом.

### 2.1 Мова інтерфейсу (i18n)
- Активна мова: **українська (UA)**
- Словник: `src/lib/i18n.ts` (UA + EN)
- Всі рядки беруться з `strings`, НІЯКИХ захардкоджених текстів у компонентах
- `lang="uk"` в `<html>`

### 2.2 Кольорова палітра (Glowing Purple)
| Токен | Dark | Light | Де використовується |
|-------|------|-------|---------------------|
| Background / Surface | `~#292929` | `#F3F2F7` | Основний фон сторінки |
| Surface Container | `~#363638` | `#EDEDF0` | Картки, плитки, Dialog |
| Surface Container High | `~#434345` | `#E3E3E7` | Інпути, hover |
| Surface Container Highest | `~#505052` | `#DDDDE0` | Elevated hover |
| Primary | `oklch(0.76 0.18 285)` | `oklch(0.55 0.2 280)` | Glowing Purple — кнопки, FAB, активні таби |
| Success | `oklch(0.7 0.15 150)` | `oklch(0.55 0.16 150)` | Чекбокси "виконано", бейджі кількості |
| Destructive | `oklch(0.7 0.19 25)` | `oklch(0.55 0.22 25)` | Видалення, прострочені завдання |

### 2.3 Скруглення (Google Workspace — сувора геометрія)
| Елемент | Клас | Примітка |
|---------|------|----------|
| **Кнопка Save/Submit** | `rounded-full` | ЄДИНИЙ pill-елемент |
| **FAB** | `rounded-xl` | Квадратна з м'якими кутами |
| **Dialog** | `rounded-lg` | Строге вікно |
| **Картки/плитки** | `rounded-md` | Мінімальне скруглення |
| **Інпути, textarea, select** | `rounded-md` | Квадратні поля |
| **Таби/вкладки** | `rounded-md` | Прямокутні, НЕ pill |
| **Чекбокси** | `rounded-[3px]` | Майже квадратні |
| **Бейджі** | `rounded-sm` | Компактні |
| **Kanban колонки** | `rounded-md` | З `overflow-hidden` |
| **View Toggle** | `rounded-md` | `border border-outline-variant/30` |
| **Заборонено** | — | `rounded-2xl`, `rounded-3xl`, `rounded-full` для інпутів/карток/табів |

### 2.4 Відступи та простір
| Контекст | Правило |
|----------|---------|
| Між секціями | `mb-3` (status sections), `gap-3` (form fields) |
| Між колонками Kanban | `gap-4 sm:gap-6` |
| Внутрішні паддінги карток | `px-3 py-2.5` |
| Внутрішні паддінги Dialog | `p-6` |
| Сторінкові поля | `px-4 sm:px-6` |
| Контейнер | `max-w-7xl` (Tasks), `max-w-3xl` (Purchases) |
| Padding bottom (FAB) | `pb-24` |
| Scroll-контейнери табів | `overflow-x-auto px-2 py-1.5 -my-1.5` (glow padding) |

### 2.5 Тіні та Glow
| Елемент | Ефект |
|---------|-------|
| FAB | `.glow-primary` — `box-shadow: 0 0 16px 4px primary/30` |
| Активний таб | `.glow-primary-sm` — `box-shadow: 0 0 8px 2px primary/20` |
| Картки (dragging) | `shadow-xl ring-2 ring-primary/30` |
| Dialog | `shadow-2xl` |
| Dropdown menu | `shadow-lg border border-outline-variant/20` |

### 2.6 Розміри елементів
| Елемент | Висота | Клас |
|---------|--------|------|
| Save кнопка | 40px | `h-10 rounded-full bg-primary px-6` |
| Cancel кнопка | 40px | `h-10 rounded-md px-5` (ghost) |
| Інпути в формах | 44px | `h-11 rounded-md bg-surface-container-high` |
| Назва (header-input) | 48px | `h-12 border-b-2 text-xl font-medium` |
| Таби | 32px | `h-8 rounded-md px-3.5 py-1.5` |
| Чекбокс | 20x20px | `rounded-[3px]` |
| Header | 56px | `h-14` |
| FAB | 56x56px | `h-14 w-14 rounded-xl` |
| Аватар | 32x32px | `h-8 w-8 rounded-full bg-primary` |

### 2.7 Компоненти
**Dialog (центрований, замість Sheet):**
- `rounded-lg bg-surface-container-high p-6 shadow-2xl max-w-md`
- Анімація: `scale: 0.95 → 1`, spring `damping: 25, stiffness: 350`
- Назва: `border-b-2 border-outline-variant/30 focus:border-primary`
- Поля: icon зліва (`size-4 text-muted-foreground/50`) + input
- Імпорт: `import { Dialog, Backdrop } from '@/components/ui/dialog'`

**FAB:**
- `fixed bottom-6 right-6 z-30 rounded-xl bg-primary glow-primary`
- `hover:scale-105 active:scale-90`

**Profile Menu:**
- Аватар: `rounded-full bg-primary` з першою літерою email
- Dropdown: `rounded-lg bg-surface-container-high shadow-lg`
- Пункти: Settings (alert), Logout (supabase.auth.signOut)

**Time Scroll Picker:**
- Два вертикальних барабани (години 00-23, хвилини 00-59)
- `scroll-snap-type: y mandatory`, `ITEM_H = 36px`
- Активний: `text-primary font-bold`, gradient fade зверху/знизу

**View Toggle (Segmented Button):**
```
Контейнер: h-9 w-[200px] rounded-md border border-outline-variant/30
Активний:  text-primary + motion.div layoutId bg-primary/10
Неактивний: text-muted-foreground hover:text-foreground
```

### 2.8 Анімації (framer-motion)
| Елемент | Параметри |
|---------|-----------|
| Натискання кнопки | `active:scale-[0.98]` |
| Dialog появлення | `scale: 0.95 → 1`, spring `damping: 25, stiffness: 350` |
| Backdrop | `bg-black/50`, fade 150ms |
| Undo toast | `y: 80 → 0`, spring |
| FAB hover | `hover:scale-105` |

### 2.9 Патерни
**Optimistic UI:**
1. `tempId = crypto.randomUUID()`
2. Додаємо в стейт миттєво
3. Запит в Supabase
4. Успіх → замінюємо temp на real data
5. Помилка → відкочуємо

**Realtime:**
- `supabase.channel()` з фільтром `family_id=eq.${familyId}`
- INSERT (дедуплікація по id), UPDATE, DELETE
- Cleanup: `supabase.removeChannel(ch)` в return useEffect

---

## 3. ТЕХНИЧЕСКИЙ СТЕК

| Категория | Технология | Версия |
|-----------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.1 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^4 |
| UI Components | shadcn/ui + @base-ui/react | ^4.1.0 |
| Animation | framer-motion | ^12.38.0 |
| Drag & Drop | @dnd-kit/core + sortable | ^6 |
| Backend / DB / Auth | Supabase | ^2.100.0 |
| Icons | Lucide React | ^1.6.0 |
| Date Picker | react-day-picker + date-fns | ^9.14.0 |
| Theme | next-themes | ^0.4.6 |
| Deploy | PM2 + Next.js standalone | — |

### Строгие правила
1. **Mobile-First:** Крупные тач-зоны, идеальный вид на смартфоне
2. **KISS:** Локальный стейт React + хуки Supabase. Без Redux/Zustand
3. **Realtime:** Supabase Realtime для синхронизации между устройствами
4. **Типизация:** Интерфейсы для всех сущностей в `src/lib/types.ts`
5. **Design System:** Каждый новый компонент ОБЯЗАН соответствовать разделу 2

---

## 4. ДЕПЛОЙ ТА МІГРАЦІЇ

> Повна інструкція для нового сервера: **SETUP.md**

### Env файли (3 шт)
| Файл | Для чого | Обов'язковий |
|------|----------|-------------|
| `.env.local` | Supabase API ключі (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Так |
| `.env.supabase` | PostgreSQL connection string для міграцій (`SUPABASE_DB_URL`) | Так |
| `.env.git` | GitHub token для push.sh (`GITHUB_TOKEN`, `GITHUB_USER`, `GITHUB_REPO`) | Ні |

### Скрипти
| Скрипт | Що робить |
|--------|-----------|
| `./deploy.sh` | git pull → npm install → **migrate.sh** → build → pm2 restart |
| `./migrate.sh` | Знаходить нові файли в `supabase/migrations/`, запускає через psql, записує в `_migrations` |
| `./push.sh "msg"` | git add → commit → push через token |

### Система міграцій
```
supabase/migrations/
  000_migrations_table.sql   ← табличка _migrations
  001_initial_schema.sql     ← profiles, purchases, tasks, projects, ideas
  002_task_description.sql   ← description в tasks
  003_purchase_and_task_lists.sql  ← purchase_lists, task_lists
  004_due_time.sql           ← due_time в tasks
  005_recipes.sql            ← таблиця recipes
```
- Кожна міграція має номер і виконується ОДИН раз
- `migrate.sh` автоматично визначає які ще не запущені
- При додаванні нового функціоналу — створити `006_xxx.sql`

### Перший запуск
```bash
git clone <repo-url> family_planner && cd family_planner
cp .env.local.example .env.local        # заповнити ключі
cp .env.supabase.example .env.supabase  # заповнити DB URL
chmod +x deploy.sh migrate.sh push.sh
./deploy.sh
```

### PM2
```bash
pm2 status              # статус
pm2 logs family-app     # логи
pm2 restart family-app  # перезапуск
```

---

## 5. ПЛАН РАЗВИТИЯ (VISION 2.0)

### Этап 5: Рефакторинг и "Вау-эффекты"
- [x] Kanban-доска для задач с Drag & Drop
- [x] Design System документация в CLAUDE.md
- [ ] Вынести общие компоненты (Sheet, Backdrop) в shared
- [ ] Dashboard с виджетами
- [ ] Swipe-to-delete на мобильных
- [ ] Поиск по всем модулям

### Этап 6: Модуль "Проекты" (Сложные цели)
- [ ] Страница списка проектов (карточки с прогресс-баром)
- [ ] Внутренняя страница проекта с вложенными подзадачами
- [ ] Привязка покупок/задач к проекту через `project_id`
- [ ] Подсчет суммы ориентировочных затрат (UAH/USD)
- [ ] Статусы проекта: "В работе", "На паузе", "Завершен"

### Этап 7: Модуль "Идеи" (Быстрые заметки)
- [ ] CRUD для заметок с заголовком и описанием
- [ ] Теги/категории для идей
- [ ] Возможность конвертировать идею в задачу или проект
- [ ] Поиск и фильтрация по тегам

### Этап 8: Интеграции
- [ ] Telegram Bot для уведомлений о просроченных задачах
- [ ] Push-уведомления через Service Worker (PWA)
- [ ] Шаринг списка покупок по ссылке (гостевой доступ)
- [ ] Экспорт данных (PDF/CSV)
