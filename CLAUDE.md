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
| Auth | Done | Email/Password через Supabase, auto-создание профиля с family_id |
| Layout | Done | Mobile-first, Header с TopNav (4 вкладки), Dark/Light theme toggle |
| Покупки | Done | Категории-списки, CRUD, чекбокс + зачеркивание, Optimistic UI, Realtime |
| Задачи | Done | Kanban (4 статуса) + List view, Drag & Drop, приоритеты, дедлайны, Realtime |
| Проекты | Placeholder | Страница-заглушка, ждет Этапа 6 |
| Идеи | Placeholder | Страница-заглушка, ждет Этапа 7 |
| Deploy | Done | Production на home.ironhelmet.com.ua, PM2 process manager |

### Supabase
- Таблицы: `profiles`, `purchases`, `tasks`, `projects`, `project_items`, `ideas`
- RLS включен на всех таблицах, фильтрация через `get_family_id()`
- Realtime включен для всех таблиц с данными
- Схема: `supabase-schema.sql`, миграция: `supabase-migration-kanban.sql`

### Структура маршрутов
```
(auth)/login     — страница входа
(app)/purchases  — модуль покупок
(app)/tasks      — модуль задач (Kanban + List)
(app)/projects   — модуль проектов (placeholder)
(app)/ideas      — модуль идей (placeholder)
```

---

## 2. DESIGN SYSTEM (Material Design 3)

Все модули ОБЯЗАНЫ следовать этим правилам. При создании нового компонента — сверяйся с этим разделом.

### 2.1 Мова інтерфейсу (i18n)
- Активна мова: **українська (UA)**
- Словник: `src/lib/i18n.ts` (UA + EN)
- Всі рядки беруться з `strings`, НІЯКИХ захардкоджених текстів у компонентах
- `lang="uk"` в `<html>`

### 2.2 Кольорова палітра (MD3)
| Токен | Dark | Light | Де використовується |
|-------|------|-------|---------------------|
| Background / Surface | `#1a1b1f` | `#F3F2F7` | Основний фон сторінки |
| Surface Container | `#2b2d31` | `#EDEDF0` | Картки, інпути, Sheet-діалоги |
| Surface Container High | `#36383d` | `#E3E3E7` | Hover, dragging-стан |
| Primary | `oklch(0.72 0.16 270)` | `oklch(0.55 0.18 270)` | Кнопки, акценти, FAB (м'який фіолетовий) |
| Success | `oklch(0.7 0.15 150)` | `oklch(0.55 0.16 150)` | Чекбокси "виконано" |
| Destructive | `oklch(0.7 0.19 25)` | `oklch(0.55 0.22 25)` | Видалення, прострочені завдання |
| Warning | `oklch(0.75 0.14 80)` | `oklch(0.7 0.15 80)` | Середній пріоритет |
| Outline | `oklch(0.5 0.01 260)` | `oklch(0.55 0.01 260)` | Рамки чекбоксів, розділювачі |
| Outline Variant | `oklch(0.35 0.01 260)` | `oklch(0.8 0.01 260)` | Тонкі границі, інпути |
| Muted text | `text-muted-foreground` | `text-muted-foreground` | Підписи, дати, плейсхолдери |

### 2.3 Скруглення (Border Radius)
| Елемент | Клас |
|---------|------|
| Картки завдань/покупок | `rounded-2xl` (16px) |
| Кнопки основні (MD3 Filled) | `rounded-full` (pill) |
| Інпути, текстареа | `rounded-2xl` (16px) |
| Bottom Sheet (mobile) | `rounded-t-[28px]` |
| Bottom Sheet (desktop) | `rounded-[28px]` |
| Pill-бейджі, таби | `rounded-full` |
| Segmented Button | `rounded-full` з `border border-outline-variant` |
| FAB | `rounded-2xl` (16px) |
| Kanban-колонки | `rounded-2xl` з `overflow-hidden` |

### 2.4 Відступи та простір
| Контекст | Правило |
|----------|---------|
| Між секціями на сторінці | `mb-8` (32px) |
| Між колонками Kanban | `gap-4 sm:gap-6` |
| Внутрішні паддінги карток | `px-4 py-3.5` |
| Внутрішні паддінги Sheet | `p-6` |
| Сторінкові поля (mobile) | `px-4` |
| Сторінкові поля (desktop) | `sm:px-6` |
| Контент-контейнер | `max-w-7xl mx-auto` (Tasks), `max-w-3xl` (Purchases) |
| Padding bottom (для FAB) | `pb-24` |

### 2.5 Тіні (Elevation — MD3)
| Елемент | Тінь |
|---------|------|
| Картки (idle) | `shadow-sm shadow-black/5 dark:shadow-black/20` |
| Картки (dragging) | `shadow-xl ring-2 ring-primary/30` |
| Bottom Sheet | `shadow-2xl` |
| FAB | `shadow-lg shadow-primary/25` |
| Kanban-колонки | `border border-outline-variant/30` (outlined style) |

### 2.6 Розміри елементів
| Елемент | Висота | Клас |
|---------|--------|------|
| Primary кнопки | 48px | `h-12 rounded-full` |
| Інпути | 56px | `h-14 rounded-2xl` |
| Вторинні кнопки | 40px | `h-10` |
| Compact кнопки (tab, toggle) | 36px | `h-9` |
| Чекбокс | 22x22px | `rounded-[6px]` |
| Header | 56px | `h-14` |
| FAB | 56x56px | `h-14 w-14 rounded-2xl` |

### 2.7 Компоненти MD3
**FAB (Floating Action Button):**
- `fixed bottom-6 right-6 z-30`
- `h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/25`
- `whileHover={{ scale: 1.05 }}` + `whileTap={{ scale: 0.9 }}`

**Bottom Sheet:**
- Mobile: `rounded-t-[28px]`, drag-handle `h-1 w-8 rounded-full bg-outline-variant/40`
- Desktop: centered `rounded-[28px] max-w-sm`
- Spring: `damping: 26, stiffness: 300`

**Segmented Button (View Toggle):**
```
Контейнер: h-10 w-[220px] rounded-full border border-outline-variant
Сегмент:   flex-1 text-[13px] font-medium
Активний:  text-primary + motion.div layoutId bg-primary/10
Неактивний: text-muted-foreground hover:text-foreground
```

### 2.8 Анімації (framer-motion)
| Елемент | Параметри |
|---------|-----------|
| Натискання кнопки | `active:scale-[0.98]` |
| Sheet появлення | `y: 60 → 0`, spring `damping: 26, stiffness: 300` |
| Backdrop | `bg-black/50`, fade 150ms |
| Елементи списку | `layout` + AnimatePresence, enter `y: -8`, exit `x: -20` |
| List spring | `type: 'spring', damping: 30, stiffness: 350` |
| Collapse секцій | `height: 0 → auto`, duration 200ms |
| FAB hover | `scale: 1.05` (whileHover) |

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

## 4. КОМАНДЫ ДЕПЛОЯ

### Быстрый деплой (одна команда)
```bash
./deploy.sh
```

### Что делает скрипт
1. Проверяет наличие `.env.local` (ключи Supabase), Node.js и PM2
2. `git pull --ff-only` — обновление кода
3. `npm install` — установка зависимостей
4. `npm run build` — сборка Next.js
5. `pm2 restart family-app` (или первый запуск, если процесс не существует)
6. Очистка fetch-cache

### Первый запуск на сервере
```bash
git clone <repo-url> family_planner
cd family_planner
cp .env.local.example .env.local   # заполнить ключи Supabase
chmod +x deploy.sh
./deploy.sh
```

### Полезные команды PM2
```bash
pm2 status              # статус процессов
pm2 logs family-app     # логи приложения
pm2 restart family-app  # перезапуск
pm2 stop family-app     # остановка
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
