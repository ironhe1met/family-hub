# Family Web Planner — Single Source of Truth

## Роль AI
Ты — Senior Full-Stack разработчик. Создаешь закрытое веб-приложение для семьи.
Делай максимально простой, читаемый и рабочий код. Не пиши код "на будущее".
Жди команды пользователя для перехода к каждому следующему этапу.

---

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

## 2. DESIGN SYSTEM (Apple Style Guide)

Все модули ОБЯЗАНЫ следовать этим правилам. При создании нового компонента — сверяйся с этим разделом.

### 2.1 Цветовая палитра
| Токен | Значение | Где используется |
|-------|----------|------------------|
| Background | `#1c1c1e` | Основной фон (`bg-background`, header bg) |
| Card Surface | `#2c2c2e` | Карточки, инпуты, Sheet-диалоги, элементы списка |
| Card Elevated | `#3a3a3c` | Dragging-состояние, hover-эффекты |
| Accent / Primary | `#0A84FF` | Кнопки действий, активные табы, фокус-кольца |
| Success | `#34C759` | Чекбоксы "выполнено" (Apple Green) |
| Danger | `#FF453A` | Удаление, просроченные задачи, высокий приоритет |
| Warning | `#FFD60A` | Средний приоритет |
| Orange | `#FF9F0A` | Статус "В процессе" |
| Muted | `#8E8E93` | Архив, неактивные элементы |
| Border | `rgba(255,255,255,0.1)` | `border-white/10` — границы карточек, инпутов |
| Divider | `bg-white/6` | Тонкие разделители между секциями |
| Muted text | `text-muted-foreground/60` | Подписи, даты, плейсхолдеры |

### 2.2 Скругления (Border Radius)
| Элемент | Класс | Значение |
|---------|-------|----------|
| Карточки задач/покупок | `rounded-2xl` | 16px |
| Кнопки, инпуты, табы | `rounded-2xl` | 16px |
| Sheet-диалоги (bottom sheet) | `rounded-3xl` | 24px |
| Pill-бейджи, small tags | `rounded-full` | 9999px |
| Segmented Control (внешний) | `rounded-2xl` | 16px |
| Segmented Control (внутренний) | `rounded-xl` | 12px |

### 2.3 Отступы и пространство
| Контекст | Правило |
|----------|---------|
| Между секциями на странице | `gap-6` или `gap-8` (24-32px) |
| Между колонками Kanban | `gap-4` (16px), на desktop `gap-5` (20px) |
| Внутренние паддинги карточек | `px-4 py-3.5` (16px / 14px) |
| Внутренние паддинги Sheet | `p-6` (24px) |
| Страничные поля (mobile) | `px-4` (16px) |
| Страничные поля (desktop) | `px-6` (24px) через `sm:px-6` |
| Контент-контейнер | `max-w-7xl mx-auto` на десктопе |

### 2.4 Тени (Elevation)
| Элемент | Тень |
|---------|------|
| Карточки задач/покупок (idle) | `shadow-sm shadow-black/20` |
| Карточки (dragging) | `shadow-xl ring-2 ring-primary/30` |
| Sheet-диалоги | `shadow-2xl` |
| Kanban-колонки | `shadow-sm shadow-black/10` |

### 2.5 Размеры элементов
| Элемент | Высота | Класс |
|---------|--------|-------|
| Основные кнопки | 48px | `h-12` |
| Инпуты | 48px | `h-12` |
| Вторичные кнопки | 40px | `h-10` |
| Compact кнопки (tab, toggle) | 36px | `h-9` |
| Чекбокс | 22x22px | `h-[22px] w-[22px]` |
| Header | 56px | `h-14` |
| Иконки в кнопках | 14-20px | `size-3.5` до `size-5` |

### 2.6 Анимации (framer-motion)
| Элемент | Параметры |
|---------|-----------|
| Клик по кнопке | `active:scale-95` |
| Sheet появление | `y: 40 → 0`, spring `damping: 28, stiffness: 320` |
| Backdrop | `bg-black/60 backdrop-blur-sm`, fade 150ms |
| Элементы списка | `layout` + AnimatePresence, enter `y: -8`, exit `x: -20` |
| List spring | `type: 'spring', damping: 30, stiffness: 350` |
| Collapse секций | `height: 0 → auto`, duration 200ms |
| Segmented Control | `layoutId` + spring transition для плавающего индикатора |

### 2.7 iOS Segmented Control (стандарт)
```
Контейнер: h-10 rounded-2xl bg-white/[0.08] p-1
Сегмент:   rounded-xl text-[13px] font-semibold
Активный:  bg-[#2c2c2e] shadow-sm shadow-black/30 text-foreground
           + motion.div layoutId="segment" (плавающая подложка)
Неактивный: text-muted-foreground/60 hover:text-muted-foreground
```

### 2.8 Паттерны
**Optimistic UI:**
1. `tempId = crypto.randomUUID()`
2. Добавляем в стейт мгновенно
3. Запрос в Supabase
4. Успех → заменяем temp на real data
5. Ошибка → откатываем

**Realtime:**
- `supabase.channel()` с фильтром `family_id=eq.${familyId}`
- INSERT (дедупликация по id), UPDATE, DELETE
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
