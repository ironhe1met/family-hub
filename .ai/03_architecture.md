# Technical Architecture

## 1. Обзор

### Архитектурный паттерн: Modular Monolith

**Почему:** 6 модулей, 2-5 пользователей, один сервер, один разработчик. Микросервисы — overkill. Чистый монолит — потом сложно разделять. Modular Monolith даёт:
- Один деплой (просто)
- Чёткие границы модулей (каждый модуль — своя папка с routes, services, types)
- Можно вынести модуль в отдельный сервис позже (если SaaS)
- Нет проблемы v1 "фикс одного ломает другое" — модули изолированы

### Схема взаимодействия

```
┌─────────────────────────────────────────────────────┐
│                    КЛИЕНТ (Browser)                 │
│              Next.js (React 19, PWA)                │
│         Service Worker (офлайн покупки)             │
└────────────┬──────────────────┬─────────────────────┘
             │ HTTP/REST        │ WebSocket
             ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                    СЕРВЕР (Ubuntu VPS)              │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │           Next.js App (Node.js)             │    │
│  │                                              │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │    │
│  │  │ API      │  │ WebSocket│  │ Auth     │  │    │
│  │  │ Routes   │  │ Server   │  │ Middleware│  │    │
│  │  │ /api/v1  │  │ (ws)     │  │ (JWT)    │  │    │
│  │  └────┬─────┘  └────┬─────┘  └──────────┘  │    │
│  │       │              │                       │    │
│  │  ┌────┴──────────────┴───────────────────┐  │    │
│  │  │           Service Layer               │  │    │
│  │  │                                        │  │    │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │  │    │
│  │  │  │Tasks │ │Purch.│ │Ideas │ │Recip.│ │  │    │
│  │  │  └──────┘ └──────┘ └──────┘ └──────┘ │  │    │
│  │  │  ┌──────┐ ┌──────┐ ┌──────┐          │  │    │
│  │  │  │Proj. │ │Budget│ │Auth  │          │  │    │
│  │  │  └──────┘ └──────┘ └──────┘          │  │    │
│  │  └────────────────┬──────────────────────┘  │    │
│  │                   │                          │    │
│  └───────────────────┼──────────────────────────┘    │
│                      │                               │
│  ┌───────────────────┴──────────────────────┐       │
│  │             PostgreSQL                    │       │
│  │  (все модули в одной БД, schema: public)  │       │
│  └───────────────────────────────────────────┘       │
│                                                      │
│  ┌──────────────────────────────────────────┐       │
│  │           File Storage (local)            │       │
│  │  /uploads/ (фото рецептов, аватары)       │       │
│  └──────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────┘
```

## 2. Стек технологий

| Компонент | Технология | Версия | Обоснование |
|-----------|-----------|--------|-------------|
| **Runtime** | Node.js | 22 LTS | Единый язык фронт+бэк, async I/O для WebSocket |
| **Framework** | Next.js (App Router) | 15+ | SSR, API Routes, React Server Components, один деплой |
| **Frontend** | React | 19 | Hooks, Server Components, знакомый стек из v1 |
| **Language** | TypeScript | 5 strict | Типобезопасность, общие типы фронт↔бэк |
| **Styling** | Tailwind CSS | 4 | Быстрая вёрстка, tree-shaking, MD3 токены из v1 |
| **UI Components** | shadcn/ui | latest | Copy-paste компоненты, полный контроль |
| **Animation** | framer-motion | 12+ | Micro-interactions, spring анимации |
| **Drag & Drop** | @dnd-kit | 6 | Kanban, сортировка, touch-friendly |
| **БД** | PostgreSQL | 16 | Надёжная, JSON support, полнотекстовый поиск, на своём сервере |
| **ORM** | Prisma | 6+ | Типобезопасные запросы, миграции, schema as code |
| **Auth** | Свой (JWT + bcrypt) | — | Полный контроль, без сторонних сервисов |
| **WebSocket** | ws (+ custom pub/sub) | 8+ | Лёгкий, нативный, без overhead Socket.io |
| **Markdown** | react-markdown + remark | latest | Рендеринг Markdown в описаниях |
| **Date** | date-fns | 4+ | Лёгкий, tree-shakable, форматирование дат |
| **Icons** | Lucide React | latest | Консистентные иконки, tree-shaking |
| **Theme** | next-themes | latest | Dark/light mode |
| **PWA** | next-pwa (Serwist) | latest | Service Worker, offline, installable |
| **File upload** | multer / formidable | — | Загрузка фото рецептов |
| **Process manager** | PM2 | latest | Авторестарт, логи, zero-downtime reload |
| **Reverse proxy** | Nginx | latest | SSL, static files, proxy → Node |

### Почему НЕ отдельный бэкенд (Express/Fastify)?

Next.js API Routes + Route Handlers покрывают все потребности:
- REST API для CRUD всех модулей
- Middleware для auth
- WebSocket через custom server (Next.js + ws)
- Один деплой, один процесс, проще DevOps
- Общие TypeScript-типы между фронтом и бэком

Отдельный бэкенд оправдан при 10+ разработчиках или микросервисах. Для нас — лишняя сложность.

### Почему Prisma, а не Drizzle / raw SQL?

- **Schema as code** — схема БД в одном файле, типы генерируются автоматически
- **Миграции** — `prisma migrate dev/deploy`, откат, история
- **Типобезопасность** — TypeScript-типы из схемы, автокомплит
- **Простота** — меньше boilerplate чем raw SQL, понятнее чем Drizzle для нового проекта

### Почему ws, а не Socket.io?

- Socket.io добавляет 50KB+ в бандл и абстракции, которые не нужны
- ws — нативный WebSocket, лёгкий, работает напрямую
- Для 2-5 пользователей custom pub/sub на ws — достаточно и прозрачно
- Реализуем простой паттерн: клиент подписывается на family_id, сервер пушит изменения

## 3. Структура проекта

```
family-hub/
├── .ai/                          # Артефакты агентов (не в prod)
├── prisma/
│   ├── schema.prisma             # Схема БД (единый источник правды)
│   └── migrations/               # Миграции Prisma
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx        # App shell: header, nav, auth guard
│   │   │   ├── tasks/page.tsx    # Тонкая страница — только композиция
│   │   │   ├── purchases/page.tsx
│   │   │   ├── ideas/page.tsx
│   │   │   ├── recipes/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── budget/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth/
│   │   │       │   ├── register/route.ts
│   │   │       │   ├── login/route.ts
│   │   │       │   ├── logout/route.ts
│   │   │       │   └── invite/route.ts
│   │   │       ├── tasks/route.ts
│   │   │       ├── tasks/[id]/route.ts
│   │   │       ├── purchases/route.ts
│   │   │       ├── purchases/[id]/route.ts
│   │   │       ├── ideas/route.ts
│   │   │       ├── recipes/route.ts
│   │   │       ├── projects/route.ts
│   │   │       ├── budget/route.ts
│   │   │       └── ...
│   │   ├── layout.tsx            # Root layout (fonts, theme, metadata)
│   │   ├── page.tsx              # Root redirect → /tasks
│   │   └── globals.css           # Tailwind config, MD3 tokens
│   │
│   ├── features/                 # Модули (feature-based architecture)
│   │   ├── auth/
│   │   │   ├── components/       # LoginForm, RegisterForm, InviteForm
│   │   │   ├── hooks/            # useAuth(), useProfile()
│   │   │   └── services/         # authService.ts (API calls)
│   │   ├── tasks/
│   │   │   ├── components/       # KanbanBoard, TaskCard, TaskForm, CalendarView, ListView
│   │   │   ├── hooks/            # useTasks(), useTaskDnD(), useSprints()
│   │   │   └── services/         # taskService.ts
│   │   ├── purchases/
│   │   │   ├── components/       # PurchaseList, PurchaseItem, PurchaseForm
│   │   │   ├── hooks/            # usePurchases(), useOfflinePurchases()
│   │   │   └── services/         # purchaseService.ts
│   │   ├── ideas/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── recipes/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   ├── projects/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   └── budget/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── services/
│   │
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # shadcn/ui (dialog, button, badge, calendar, etc.)
│   │   ├── nav/                  # TopNav, BottomNav
│   │   ├── markdown-renderer.tsx # Рендеринг Markdown
│   │   └── theme-provider.tsx
│   │
│   ├── lib/                      # Shared utilities
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── auth.ts               # JWT verify/sign, middleware helper
│   │   ├── ws.ts                 # WebSocket client (подключение, подписки)
│   │   ├── i18n.ts               # Строки UA/EN
│   │   ├── utils.ts              # cn(), formatDate(), etc.
│   │   └── types.ts              # Shared types (если нужны сверх Prisma)
│   │
│   ├── server/                   # Server-only code
│   │   ├── ws-server.ts          # WebSocket server (pub/sub по family_id)
│   │   ├── auth-middleware.ts    # JWT verification для API routes
│   │   ├── services/             # Server-side business logic
│   │   │   ├── task.service.ts
│   │   │   ├── purchase.service.ts
│   │   │   ├── idea.service.ts
│   │   │   ├── recipe.service.ts
│   │   │   ├── project.service.ts
│   │   │   ├── budget.service.ts
│   │   │   └── recurring.service.ts  # Повторяющиеся задачи + регулярные платежи
│   │   └── cron/                 # Cron jobs
│   │       └── recurring.ts      # Создание повторяющихся задач, напоминания о платежах
│   │
│   └── middleware.ts             # Next.js middleware (auth redirect)
│
├── public/
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker (generated)
│   └── icons/                    # PWA icons
│
├── uploads/                      # Загруженные файлы (фото рецептов)
│
├── tests/                        # Тесты (создаётся на этапе QA)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                  # Шаблон env-переменных
├── docker-compose.yml            # PostgreSQL + App
├── Dockerfile
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Ключевые принципы структуры:

1. **Feature-based** — каждый модуль в `features/` со своими components, hooks, services. Модуль покупок не знает о модуле задач.
2. **Тонкие страницы** — `page.tsx` только компонует feature-компоненты, никакой бизнес-логики.
3. **Server/Client разделение** — `server/` содержит код, который никогда не попадёт в бандл клиента.
4. **Shared UI** — `components/ui/` для переиспользуемых компонентов (shadcn/ui).
5. **Один Prisma client** — `lib/db.ts`, общий для всех server-side services.

## 4. Performance Budget

| Метрика | Целевое значение | Источник |
|---------|-----------------|----------|
| Время ответа API (p95) | < 200ms | PRD |
| Загрузка страницы (FCP) | < 2s | PRD |
| Time to Interactive (TTI) | < 3s | Best practice |
| WebSocket latency | < 500ms | PRD |
| Макс. одновременных WS-подключений | 10 | 2-5 пользователей × 2 вкладки |
| Макс. записей на семью (12 мес.) | 10 000 | PRD |
| Макс. размер БД (12 мес.) | ~100 MB | оценка (10K записей + индексы) |
| Bundle size (JS, gzip) | < 200 KB initial | Best practice |
| Lighthouse Performance | > 90 | Best practice |
| Офлайн (покупки) | Работает без сети | PRD |

## 5. Безопасность

### Аутентификация
- **JWT** (access token + refresh token)
- Access token: 15 минут, в httpOnly cookie
- Refresh token: 7 дней, в httpOnly cookie, ротация при использовании
- Пароли: **bcrypt** (cost factor 12)
- При логине: rate limiting 5 попыток / минуту на IP

### Авторизация
- **Family-based isolation**: каждый запрос фильтруется по `family_id` текущего пользователя
- Middleware проверяет JWT → извлекает `userId` → из БД получает `familyId`
- Все CRUD-операции автоматически scope'ятся по `familyId`
- В MVP одна роль — все члены семьи равны

### Защита данных
- Пароли: bcrypt hash (никогда не хранятся в открытом виде)
- JWT secret: в .env, 256-bit random
- HTTPS обязателен (SSL через Nginx + Let's Encrypt)
- SQL injection: Prisma parameterized queries (защита из коробки)
- XSS: React auto-escaping + CSP headers
- CSRF: SameSite cookies + Origin check

### Управление секретами
- `.env` файл на сервере (не в git)
- `.env.example` в git (шаблон без значений)
- Секреты: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`

### Rate Limiting
- Auth endpoints: 5 req/min per IP
- API endpoints: 100 req/min per user
- WebSocket messages: 50 msg/min per connection
- Реализация: in-memory rate limiter (для 2-5 пользователей хватит)

### CORS
- Разрешён только `home.ironhelmet.com.ua`
- В dev: `localhost:3000`

## 6. Инфраструктура

### Контейнеризация
- **docker-compose.yml**: PostgreSQL + Next.js App
- PostgreSQL: persistent volume для данных
- App: multi-stage build (deps → build → production)
- Альтернатива: PM2 напрямую без Docker (проще для одного сервера)

### CI/CD
- MVP: ручной деплой через `deploy.sh` (git pull → prisma migrate → build → pm2 restart)
- v2: GitHub Actions (lint → test → build → deploy по push в main)

### Хостинг
- Ubuntu VPS (4-8 GB RAM, 2-4 CPU)
- Nginx: reverse proxy, SSL (Let's Encrypt, auto-renew), static files, gzip
- PM2: process manager, авторестарт, логи

### Мониторинг
- PM2 built-in: CPU, memory, restarts, logs
- PostgreSQL: pg_stat_statements для медленных запросов
- Nginx: access/error logs
- v2: Grafana + Prometheus

### Бэкапы
- PostgreSQL: pg_dump ежедневно → cron → хранение 7 дней
- Uploads (фото): rsync → backup directory
- .env: ручной бэкап в безопасное место
- **RTO:** 1 час (восстановление из бэкапа)
- **RPO:** 24 часа (максимум потеря данных за день)

### Disaster Recovery
1. Восстановить PostgreSQL из последнего pg_dump
2. git clone + prisma migrate deploy + pm2 start
3. Восстановить uploads из бэкапа

## 7. Стратегия миграций БД

- **Инструмент:** Prisma Migrate
- **Schema:** `prisma/schema.prisma` — единый источник правды
- **Команды:**
  - `npx prisma migrate dev` — создать + применить миграцию (dev)
  - `npx prisma migrate deploy` — применить все pending миграции (prod)
  - `npx prisma migrate reset` — сбросить БД (только dev!)
- **Правила:**
  - Каждая миграция — отдельный файл с timestamp
  - Backward-compatible: не удалять колонки сразу, сначала пометить deprecated
  - Деструктивные изменения — через 2 миграции (add new → migrate data → drop old)
  - Тестировать миграции на копии prod-данных перед деплоем

## 8. WebSocket — стратегия Realtime

### Архитектура

```
Клиент A (семья 123)          Сервер              Клиент B (семья 123)
     │                          │                        │
     │── connect ──────────────▶│                        │
     │── subscribe(family:123)─▶│                        │
     │                          │◀── connect ────────────│
     │                          │◀── subscribe(family:123)│
     │                          │                        │
     │── API: create task ─────▶│                        │
     │                          │── broadcast(family:123)▶│
     │◀── ack ─────────────────│                        │
     │                          │                        │
```

### Протокол сообщений

```json
// Клиент → Сервер
{ "type": "subscribe", "channel": "family:123" }

// Сервер → Клиент
{ "type": "change", "module": "tasks", "action": "create", "data": {...} }
{ "type": "change", "module": "tasks", "action": "update", "data": {...} }
{ "type": "change", "module": "tasks", "action": "delete", "data": { "id": "..." } }
```

### Реализация
- После каждой CRUD-операции в API → broadcast change event на все WS-подключения семьи
- Клиент получает event → обновляет локальный стейт (без повторного fetch)
- Дедупликация: клиент, инициировавший изменение, игнорирует свой собственный broadcast (по requestId)
- Reconnect: при разрыве → exponential backoff (1s, 2s, 4s, max 30s)
- Heartbeat: ping/pong каждые 30 секунд

## 9. PWA и Офлайн — стратегия

### PWA
- `manifest.json`: name, icons, theme_color, display: standalone
- Service Worker (через Serwist/next-pwa): кеширование статики + app shell
- Install prompt: автоматический

### Офлайн покупок
- **Стратегия:** IndexedDB как локальный кеш для покупок
- При загрузке: данные покупок копируются в IndexedDB
- Без интернета: чтение/чекание из IndexedDB
- При восстановлении: синхронизация diff с сервером
- Конфликты: **last write wins** (для чекбоксов — достаточно, оба видят одно и то же)
- Только покупки в MVP (остальные модули — online only)

## 10. Cron Jobs (повторяющиеся задачи и платежи)

- **Инструмент:** node-cron (in-process) или crontab
- **Расписание:** каждый час проверять:
  1. Повторяющиеся задачи: если текущая выполнена → создать следующую
  2. Регулярные платежи: если дата наступила → создать напоминание (in-app)
  3. Просроченные задачи: пометить как overdue
- **Идемпотентность:** каждый cron job проверяет, не создано ли уже (по уникальному ключу recurring_id + date)

## 11. Интеграции

| Сервис | Назначение | Критичность |
|--------|-----------|-------------|
| Нет внешних в MVP | Всё на своём сервере | — |
| Let's Encrypt | SSL-сертификат (через certbot) | Must |

> v2: Telegram Bot API, n8n, OCR-сервис

---

## 12. Профиль пользователя

### MVP
| Поле | Тип | Зачем |
|------|-----|-------|
| Имя | text | Отображается в UI, на задачах ("назначил Олена") |
| Фамилия | text | Полное имя |
| Email | text | Логин, уведомления |
| Аватар (фото) | file | Загрузить фотку, видно в шапке и на задачах |
| Telegram username | text | Для v2 — бот знает куда слать |
| Дата рождения | date | Напоминания о днях рождения |
| Телефон | text | Для восстановления, 2FA в будущем |
| Язык интерфейса | enum | UA / EN |
| Тема | enum | Dark / Light |

### Настройки аккаунта (MVP)
- Сменить пароль
- Invite-код — пригласить в свою семью
- Список членов семьи (кто в семье)

### Регистрация
- Новый пользователь регистрируется → создаётся новая семья (family_id)
- Если есть invite-код → присоединяется к существующей семье
- Другие люди (друзья, знакомые) создают свои семьи через обычную регистрацию — данные изолированы

### v2
- OAuth (Google / Apple login)
- Часовой пояс (для напоминаний)
- Роль в семье (Admin / Member / Child)

---

## Handoff → Design Agent
- **Фронтенд-стек:** Next.js 15+ (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui + framer-motion + @dnd-kit
- **Роли и доступы:** Одна роль — "Член семьи". Все видят все экраны. Делегирование задач визуально (аватар исполнителя), но не ограничивает доступ.
- **Ключевые сущности в UI:**
  - Задачи: карточки с приоритетом (цвет), дедлайном, исполнителем (аватар), подзадачами (прогресс), тегами (бейджи)
  - Покупки: простые чеклисты, вкладки по магазинам
  - Идеи: карточки с заголовком, тегами, кнопки конвертации
  - Рецепты: карточки с фото, кнопка "В покупки"
  - Проекты: карточки с прогресс-баром, бюджетом
  - Бюджет: баланс, список транзакций, регулярные платежи
- **Ограничения UI:**
  - Навигация: 6 модулей в один ряд (Задачи, Проекты, Покупки, Рецепты, Бюджет, Идеи)
  - Markdown рендерится через react-markdown (не WYSIWYG в MVP)
  - Офлайн только для покупок (остальные — "нет связи" индикатор)
  - Фото рецептов: upload через форму, хранение на сервере в /uploads/
  - WebSocket индикатор: зелёная/красная точка (онлайн/офлайн)
