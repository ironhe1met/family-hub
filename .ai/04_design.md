# UI/UX Design

## 1. Карта экранов

### Структура навигации

```
                        ┌──────────────┐
                        │   /login     │
                        │  /register   │
                        └──────┬───────┘
                               │ (auth)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    App Shell (layout)                         │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Header: Logo | Module Tabs | Notifications | Profile  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────┐ ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌───┐│
│  │Tasks │ │ Projects │ │Purchas.│ │Recipes │ │Budget│ │Ideas│
│  │      │ │          │ │        │ │        │ │      │ │   ││
│  │Kanban│ │ List     │ │ Lists  │ │ Cards  │ │Summ. │ │List││
│  │List  │ │ Detail   │ │ Items  │ │ Detail │ │Trans.│ │   ││
│  │Calen.│ │          │ │        │ │        │ │Recur.│ │   ││
│  └──────┘ └──────────┘ └────────┘ └────────┘ └──────┘ └───┘│
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Settings | Profile | Family Members | Invite          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Список экранов

| # | Экран | URL | Описание |
|---|-------|-----|----------|
| 1 | Login | `/login` | Вход: email + пароль |
| 2 | Register | `/register` | Регистрация: email, пароль, имя, название семьи |
| 3 | Register (invite) | `/register?invite=CODE` | Регистрация по инвайт-коду |
| 4 | **Tasks** | `/tasks` | Задачи: переключение Kanban / List / Calendar |
| 5 | Task Detail | Dialog | Просмотр/редактирование задачи (подзадачи, комментарии) |
| 6 | **Projects** | `/projects` | Список проектов (карточки с прогрессом) |
| 7 | Project Detail | `/projects/:id` | Проект: описание + подзадачи + бюджет |
| 8 | **Purchases** | `/purchases` | Списки покупок (вкладки по магазинам) |
| 9 | **Recipes** | `/recipes` | Список рецептов (карточки с фото) |
| 10 | Recipe Detail | `/recipes/:id` | Рецепт: описание + ингредиенты + инструкция |
| 11 | Recipe Form | Dialog | Создание/редактирование рецепта |
| 12 | **Budget** | `/budget` | Баланс + транзакции + регулярные платежи |
| 13 | **Ideas** | `/ideas` | Список идей (карточки с тегами) |
| 14 | Settings | `/settings` | Профиль, семья, приглашения, тема, язык |
| 15 | Notifications | Popover | Список уведомлений (из шапки) |

---

## 2. Описание экранов (черновик)

### App Shell (Layout)
- **Header (56px, sticky):**
  - Лево: Logo / название "Family Hub"
  - Центр: Module Tabs — 6 вкладок в одну строку, горизонтальный скролл на мобильном
  - Право: Notification bell (badge с числом непрочитанных) + Avatar (→ dropdown: Profile, Settings, Logout)
- **Content area:** Под хедером, полная ширина
- **Нет нижней навигации** — табы в хедере, чтобы не занимать место на мобильном
- **FAB** (кнопка +): фиксированная, bottom-right, для быстрого создания (контекстная — зависит от модуля)
- **WebSocket индикатор:** маленькая точка в хедере (зелёная = онлайн, красная = нет связи)

### Login
- Центрированная форма на чистом фоне
- Logo + название сверху
- Email input, Password input
- Кнопка "Увійти" (primary, pill)
- Ссылка "Немає акаунту? Зареєструватися"
- Ошибка: красный текст под формой

### Register
- Аналогичная форма
- Поля: Ім'я, Email, Пароль, Назва сім'ї
- Если есть invite-код в URL — поле "Назва сім'ї" скрыто, показано "Приєднуєтесь до сім'ї: Петренко"
- Кнопка "Зареєструватися"
- Ссылка "Вже є акаунт? Увійти"

### Tasks (главный экран)
- **Toolbar:** View toggle (Kanban | List | Calendar) + Filter button + Sprint selector
- **Filters panel (раскрываемая):** По списку, приоритету, исполнителю, тегу, статусу
- **Kanban view:**
  - 4 колонки: Нові | В роботі | Виконані | Архів
  - Карточки задач: title, priority badge (цвет), дедлайн (если есть, красный если просрочен), аватар исполнителя, прогресс подзадач (2/5), теги (бейджи)
  - Drag & drop между колонками
  - Скролл горизонтальный на мобильном
- **List view:**
  - Секции по статусу (сворачиваемые)
  - Строка задачи: checkbox + title + priority dot + due date + assignee avatar + tags
  - Tap на задачу → открывает Task Detail dialog
- **Calendar view:**
  - Месячный календарь
  - Дни с задачами — точки/бейджи
  - Tap на день → список задач на этот день снизу
- **FAB (+):** Создать задачу → Task Detail dialog (режим создания)

### Task Detail (Dialog)
- **Заголовок:** большой input (underline style), Markdown не нужен тут
- **Описание:** textarea с Markdown, preview при просмотре
- **Поля (icon + value rows):**
  - 📋 Список (dropdown)
  - 🏃 Спринт (dropdown)
  - 👤 Виконавець (dropdown с аватарками членов семьи)
  - 📅 Дедлайн (date picker + time picker)
  - 🔴 Пріоритет (3 кнопки: High/Med/Low)
  - 🏷 Теги (chips input)
  - 🔁 Повторення (toggle + rule selector)
  - 🔔 Нагадування (toggle + time selector)
- **Подзадачи:** чеклист, кнопка "+ Додати крок", прогресс (3/5)
- **Комментарии:** список (аватар + имя + время + текст), input внизу
- **Статус:** 4 кнопки внизу (New / In Progress / Done / Archive)
- **Actions:** Delete (destructive)

### Projects
- **Список проектов (карточки):**
  - Title, description (1-2 строки), status badge
  - Progress bar (3/10 элементов, 30%)
  - Бюджет: "₴15,000 з ₴25,000"
  - Tap → Project Detail
- **Фильтр:** по статусу (Active / Paused / Completed)
- **FAB (+):** Создать проект

### Project Detail
- **Header:** title + status badge + edit button
- **Description:** Markdown rendered
- **Budget summary:** Потрачено / Запланировано (bar)
- **Items list:**
  - Checkbox + title + cost + status badge + URL link icon
  - Tap → inline edit
  - "+ Додати елемент" button
- **Actions:** Edit project, Delete

### Purchases
- **Tabs:** вкладки по магазинам (горизонтальный скролл), "+ Новий список"
- **Список товаров:**
  - Активные сверху, купленные снизу (зачёркнутые, fade)
  - Строка: checkbox + name + quantity
  - Tap checkbox → toggle bought (optimistic)
  - Swipe left или long press → delete (с undo toast)
- **Quick add:** инлайн-поле вверху списка ("Додати товар...")
- **Empty state:** иконка + "Список порожній"
- **Offline indicator:** banner "Офлайн — зміни синхронізуються при підключенні"

### Recipes
- **Grid / List:** карточки с фото
  - Фото (или placeholder icon), title, ingredient count, author avatar
  - Tap → Recipe Detail
- **Search:** строка поиска вверху
- **FAB (+):** Создать рецепт

### Recipe Detail
- **Hero:** фото рецепта (большое, или placeholder)
- **Title + author + date**
- **Description:** Markdown rendered
- **Ingredients:**
  - Список: name + quantity
  - Кнопка "📥 В покупки" → выбрать список → ингредиенты добавляются
- **Instructions:** Markdown rendered (пошагово)
- **Actions:** Edit, Delete

### Recipe Form (Dialog)
- Title input
- Description textarea (Markdown)
- Image upload (drag or tap)
- Ingredients list: name + quantity, "+ Додати інгредієнт"
- Instructions textarea (Markdown)
- Save / Cancel

### Budget
- **Top:** Баланс за месяц (большая цифра): Дохід - Витрати = Залишок
- **Month selector:** ← Березень 2026 →
- **Tabs:** Транзакції | Регулярні | Заплановані
- **Транзакції tab:**
  - Список: icon category + description + amount (зелёный доход, красный расход) + date
  - FAB (+) → форма добавления транзакции
- **Регулярні tab:**
  - Список: title + amount + period + next date + кнопка "Сплачено"
  - "Сплачено" → создаёт транзакцию + сдвигает дату
  - Карточки с highlight если "скоро оплата" (< 3 дней)
- **Заплановані tab:**
  - Список: title + amount + target date
  - "Виконано" → форма с реальной суммой → транзакция

### Ideas
- **Список (карточки):**
  - Title, description (1-2 строки, truncated), tags (бейджи), author, date
  - Кнопки: "→ Задача", "→ Проект" (конвертация)
  - Если конвертирована → бейдж "Конвертовано в задачу"
- **Search + filter по тегу**
- **FAB (+):** Создать идею → простая форма (title + description + tags)

### Settings
- **Sections:**
  - **Профіль:** Аватар (загрузка), Ім'я, Прізвище, Email (readonly), Телефон, Telegram, Дата народження
  - **Сім'я:** Назва сім'ї, список членів (аватар + ім'я + email), кнопка "Запросити"
  - **Запрошення:** Генерація invite-коду, показ коду + "дійсний 24 години"
  - **Безпека:** Зміна паролю
  - **Інтерфейс:** Мова (UA/EN), Тема (Dark/Light/System)

### Notifications (Popover)
- Из шапки: tap на bell icon → popover
- Список: icon + title + body + time + read/unread dot
- Tap → переход к сущности (задача, платёж)
- "Позначити всі як прочитані"

---

## 3. Дизайн-система

### Стиль: Google Material Design 3

Чистый, строгий, геометричный стиль в духе Google Workspace. Один акцентный цвет, минимум декора, максимум функционала.

### Цвета — Dark Mode (по умолчанию)

| Роль | CSS Variable | Значение | Использование |
|------|-------------|----------|---------------|
| Background | `--background` | `oklch(0.185 0.005 260)` / #1C1C1E | Фон страницы |
| Surface | `--surface` | `oklch(0.22 0.006 260)` / #2C2C2E | Карточки, секции |
| Surface Container | `--surface-container` | `oklch(0.26 0.007 260)` / #3A3A3C | Inputs, dialogs |
| Surface Container High | `--surface-container-high` | `oklch(0.31 0.007 260)` / #48484A | Hover на inputs |
| Surface Elevated | `--surface-elevated` | `oklch(0.36 0.007 260)` / #545456 | Elevated hover |
| Primary | `--primary` | `oklch(0.72 0.16 250)` / #5BA4F5 | Акцент — кнопки, активные табы, FAB, ссылки |
| Primary Hover | `--primary-hover` | `oklch(0.78 0.14 250)` / #7DB8F7 | Hover на primary |
| On Primary | `--on-primary` | `#FFFFFF` | Текст на primary кнопках |
| Foreground | `--foreground` | `oklch(0.93 0.005 260)` / #E5E5E7 | Основной текст |
| Muted Foreground | `--muted-foreground` | `oklch(0.62 0.01 260)` / #8E8E93 | Вторичный текст, подписи |
| Success | `--success` | `oklch(0.72 0.16 155)` / #34C759 | Checkbox done, доходы |
| Destructive | `--destructive` | `oklch(0.68 0.19 25)` / #FF453A | Delete, ошибки, расходы, overdue |
| Warning | `--warning` | `oklch(0.78 0.16 80)` / #FFD60A | Приоритет medium, предупреждения |
| Outline | `--outline` | `oklch(0.35 0.005 260)` / #3D3D3F | Бордеры |
| Outline Variant | `--outline-variant` | `oklch(0.28 0.005 260)` / #333335 | Тонкие разделители |

### Цвета — Light Mode

| Роль | CSS Variable | Значение | Использование |
|------|-------------|----------|---------------|
| Background | `--background` | `oklch(0.98 0.002 260)` / #F6F6F8 | Фон страницы |
| Surface | `--surface` | `#FFFFFF` | Карточки, секции |
| Surface Container | `--surface-container` | `oklch(0.95 0.004 260)` / #ECECEE | Inputs, dialogs |
| Surface Container High | `--surface-container-high` | `oklch(0.92 0.005 260)` / #E2E2E5 | Hover |
| Surface Elevated | `--surface-elevated` | `oklch(0.88 0.006 260)` / #D8D8DB | Elevated hover |
| Primary | `--primary` | `oklch(0.55 0.2 250)` / #2979FF | Акцент |
| Primary Hover | `--primary-hover` | `oklch(0.50 0.22 250)` / #1565C0 | Hover |
| On Primary | `--on-primary` | `#FFFFFF` | Текст на primary |
| Foreground | `--foreground` | `oklch(0.15 0.015 260)` / #1C1C1E | Основной текст |
| Muted Foreground | `--muted-foreground` | `oklch(0.50 0.015 260)` / #6C6C70 | Вторичный |
| Success | `--success` | `oklch(0.55 0.18 155)` / #28A745 | Done |
| Destructive | `--destructive` | `oklch(0.55 0.22 25)` / #D32F2F | Errors |
| Warning | `--warning` | `oklch(0.70 0.18 80)` / #F9A825 | Warnings |
| Outline | `--outline` | `oklch(0.82 0.008 260)` / #C7C7CC | Бордеры |
| Outline Variant | `--outline-variant` | `oklch(0.90 0.005 260)` / #E0E0E3 | Разделители |

### Акцентный цвет: Blue

Вместо Purple из v1 — **Blue** (Google-стиль). Синий воспринимается нейтральнее, профессиональнее, лучше работает с MD3. Glow-эффект сохраняем, но в синем.

```css
.glow-primary { box-shadow: 0 0 16px 4px oklch(0.72 0.16 250 / 0.3); }
.glow-primary-sm { box-shadow: 0 0 8px 2px oklch(0.72 0.16 250 / 0.2); }
```

### Priority Colors

| Приоритет | Dark Mode | Light Mode | Использование |
|-----------|-----------|------------|---------------|
| High | `oklch(0.68 0.19 25)` / red | `oklch(0.55 0.22 25)` | Dot, badge border |
| Medium | `oklch(0.78 0.16 80)` / yellow | `oklch(0.70 0.18 80)` | Dot, badge border |
| Low | `oklch(0.55 0.01 260)` / gray | `oklch(0.62 0.01 260)` | Dot, badge border |

### Типографика

| Элемент | Шрифт | Размер | Вес | Line Height |
|---------|-------|--------|-----|-------------|
| H1 (page title) | Inter | 24px (`text-2xl`) | 600 (`font-semibold`) | 1.3 |
| H2 (section title) | Inter | 18px (`text-lg`) | 500 (`font-medium`) | 1.4 |
| H3 (card title) | Inter | 16px (`text-base`) | 500 (`font-medium`) | 1.4 |
| Body | Inter | 15px (`text-[15px]`) | 400 (`font-normal`) | 1.5 |
| Body Small | Inter | 14px (`text-sm`) | 400 | 1.5 |
| Caption | Inter | 12px (`text-xs`) | 500 (`font-medium`) | 1.4 |
| Button | Inter | 14px (`text-sm`) | 500 (`font-medium`) | 1 |

**Шрифт:** Inter (Google Fonts), fallback: `ui-sans-serif, system-ui, sans-serif`
**Подключение:** `next/font/google`, subsets: `['latin', 'cyrillic']`

### Компоненты

#### Кнопки

| Вариант | Стили | Использование |
|---------|-------|---------------|
| **Primary** | `h-10 rounded-full bg-primary text-on-primary px-6 font-medium` | Save, Submit, главные действия |
| **Secondary** | `h-10 rounded-md bg-surface-container text-foreground px-5` | Cancel, второстепенные |
| **Ghost** | `h-10 rounded-md text-muted-foreground hover:bg-surface-container px-4` | Inline actions |
| **Destructive** | `h-10 rounded-md bg-destructive/10 text-destructive px-5` | Delete |
| **Icon** | `h-9 w-9 rounded-md` | Toolbar icons |
| **FAB** | `h-14 w-14 rounded-xl bg-primary glow-primary` | Floating action |

**Состояния:** hover (`opacity-90` или bg shift), active (`scale-[0.98]`), disabled (`opacity-50 pointer-events-none`), focus (`ring-2 ring-primary/50`)

#### Inputs

| Вариант | Стили |
|---------|-------|
| **Text** | `h-11 rounded-md bg-surface-container px-3 border border-outline/30 focus:border-primary` |
| **Title (dialog header)** | `h-12 border-b-2 border-outline-variant bg-transparent text-xl font-medium focus:border-primary` |
| **Textarea** | `rounded-md bg-surface-container p-3 border border-outline/30 min-h-[100px]` |
| **Select** | аналогично Text |
| **Checkbox** | `h-5 w-5 rounded-[3px] border-2 border-outline` → checked: `bg-success border-success` |
| **Chips (tags)** | `h-7 rounded-sm bg-surface-container px-2 text-xs` |

#### Карточки

| Вариант | Стили |
|---------|-------|
| **Default** | `rounded-md bg-surface p-4 border border-outline-variant/30` |
| **Kanban card** | `rounded-md bg-surface px-3 py-2.5 border border-outline-variant/30 hover:border-primary/30` |
| **Recipe card** | `rounded-md bg-surface overflow-hidden border border-outline-variant/30` (фото сверху) |
| **Dragging** | `shadow-xl ring-2 ring-primary/30 rotate-[2deg]` |

#### Dialog (Modal)

```
Backdrop: bg-black/50, fade 150ms
Container: rounded-lg bg-surface-container p-6 shadow-2xl max-w-lg w-full
Animation: scale 0.95→1, spring (damping: 25, stiffness: 350)
Close: Escape key + backdrop click + X button
```

#### Toast (Undo, notifications)

```
Position: bottom-center, mb-6
Style: rounded-md bg-surface-elevated px-4 py-3 shadow-lg
Animation: y: 80→0, spring
Duration: 4s (undo), 3s (info)
```

#### Tabs (Module navigation)

```
Container: h-10 flex gap-1 overflow-x-auto
Tab: h-8 rounded-md px-3.5 text-sm font-medium
Active: bg-primary/15 text-primary glow-primary-sm
Inactive: text-muted-foreground hover:bg-surface-container
```

#### View Toggle (Kanban/List/Calendar)

```
Container: h-9 rounded-md border border-outline-variant/30 inline-flex
Segment: px-3 text-sm
Active: text-primary + motion.div layoutId bg-primary/10
Inactive: text-muted-foreground
```

### Анимации и переходы

| Элемент | Тип | Параметры |
|---------|-----|-----------|
| Button press | scale | `active:scale-[0.98]` |
| Button hover | opacity | `hover:opacity-90`, 150ms |
| Dialog appear | scale + fade | `0.95→1`, spring (damping:25, stiffness:350) |
| Backdrop | fade | 150ms ease |
| Toast | slide up | `y:80→0`, spring |
| FAB hover | scale | `hover:scale-105` |
| FAB press | scale | `active:scale-90` |
| View toggle | layoutId | motion.div animated background |
| Page transition | none | Мгновенная смена (SPA, без transition) |
| Skeleton loading | pulse | `animate-pulse`, bg shimmer |
| Drag overlay | shadow + rotate | `shadow-xl rotate-[2deg]` |

### Доступность (a11y)

| Требование | Реализация |
|------------|------------|
| Контраст текста | Min 4.5:1 (WCAG AA). Foreground на Background: 15.5:1 dark, 14:1 light |
| Touch targets | Min 44x44px. Все кнопки/чекбоксы/табы ≥ 44px зона |
| Focus states | `focus-visible:ring-2 ring-primary/50 ring-offset-2 ring-offset-background` |
| Keyboard nav | Tab через все интерактивные элементы, Escape закрывает dialog/popover |
| ARIA | Dialog: `role="dialog"`, `aria-modal="true"`. Tabs: `role="tablist"`. Notifications: `aria-live="polite"` |
| Screen readers | `aria-label` на icon buttons. `alt` на images. `sr-only` labels |
| Reduced motion | `@media (prefers-reduced-motion)` → отключить spring анимации |

### Сетка и отступы

| Параметр | Значение |
|----------|----------|
| Container | `max-w-7xl mx-auto` (1280px) |
| Page padding | `px-4 sm:px-6` |
| Section gap | `gap-4 sm:gap-6` |
| Card padding | `p-4` (default), `px-3 py-2.5` (compact/kanban) |
| Dialog padding | `p-6` |
| FAB position | `fixed bottom-6 right-6 z-30` |
| Scroll padding | `pb-24` (для FAB) |

### Breakpoints

| Name | Width | Что меняется |
|------|-------|-------------|
| Mobile | < 640px | Одна колонка, tabs скроллятся, kanban скроллится горизонтально |
| Tablet | 640-1024px | 2 колонки kanban, sidebar возможен |
| Desktop | > 1024px | 4 колонки kanban, полная ширина |

### Иконки

**Библиотека:** Lucide React (линейные, 24x24, stroke-width: 2)

| Модуль | Иконка |
|--------|--------|
| Tasks | `check-square` / `list-checks` |
| Projects | `folder-kanban` |
| Purchases | `shopping-cart` |
| Recipes | `chef-hat` |
| Budget | `wallet` |
| Ideas | `lightbulb` |
| Notifications | `bell` |
| Settings | `settings` |
| Profile | `user` |
| Search | `search` |
| Add | `plus` |
| Delete | `trash-2` |
| Edit | `pencil` |

### Состояния экранов

Каждый экран должен иметь 4 состояния:

| Состояние | Реализация |
|-----------|------------|
| **Loading** | Skeleton-заглушки (pulse animation), повторяющие форму контента |
| **Empty** | Центрированно: иконка (64px, muted) + заголовок + подсказка + CTA кнопка |
| **Error** | Красный banner сверху: иконка + текст ошибки + кнопка "Спробувати знову" |
| **Success** | Toast notification (зелёный) или auto-close dialog |

---

## Handoff → Developer Agent
- **Порядок вёрстки:**
  1. Layout (App Shell: header, tabs, FAB)
  2. Auth (login, register)
  3. Tasks (самый сложный — Kanban + List + Calendar + Detail dialog)
  4. Purchases (простой, но нужен офлайн)
  5. Ideas (простой CRUD)
  6. Recipes (CRUD + image upload + to-purchases)
  7. Projects (CRUD + items)
  8. Budget (transactions + recurring + planned)
  9. Settings (profile + family + invite)
  10. Notifications (popover)
- **Сложные компоненты:** Kanban DnD, Calendar view, Time picker, Markdown renderer, Offline sync (purchases), WebSocket client
- **Переиспользование:** Dialog, Toast, Empty state, Skeleton, Card, Tabs, FAB — shared components. Tags/Chips input — shared между Tasks и Ideas.
- **Адаптивность:** Mobile-first. Критичные breakpoints: 640px (sm) и 1024px (lg). Kanban горизонтальный скролл на mobile.
