# Database Schema

## СУБД: PostgreSQL 16

## Таблицы

---

### families
Семья — корневая сущность. Все данные привязаны к семье.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, default gen_random_uuid() | ID семьи |
| name | VARCHAR(100) | NOT NULL | Название семьи ("Семья Петренко") |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Дата создания |

---

### users
Член семьи. Привязан к одной семье через family_id.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, default gen_random_uuid() | ID пользователя |
| family_id | UUID | FK → families.id, NOT NULL | Семья пользователя |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email (логин) |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash пароля |
| first_name | VARCHAR(100) | NOT NULL | Имя |
| last_name | VARCHAR(100) | | Фамилия |
| avatar_url | TEXT | | Путь к фото аватара |
| telegram_username | VARCHAR(100) | | Telegram для v2 бота |
| phone | VARCHAR(20) | | Телефон |
| birth_date | DATE | | Дата рождения |
| locale | VARCHAR(5) | NOT NULL, default 'uk' | Язык: 'uk' / 'en' |
| theme | VARCHAR(10) | NOT NULL, default 'dark' | Тема: 'dark' / 'light' |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | Дата регистрации |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | Последнее обновление |

---

### invites
Invite-код для приглашения в семью.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK, default gen_random_uuid() | ID инвайта |
| family_id | UUID | FK → families.id, NOT NULL | В какую семью приглашают |
| code | VARCHAR(20) | UNIQUE, NOT NULL | Код приглашения |
| created_by | UUID | FK → users.id, NOT NULL | Кто создал |
| used_by | UUID | FK → users.id | Кто использовал (null если не использован) |
| expires_at | TIMESTAMPTZ | NOT NULL | Срок действия (24 часа) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### task_lists
Списки задач для группировки ("Дом", "Работа", "Дети").

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | Название списка |
| sort_order | INT | NOT NULL, default 0 | Порядок отображения |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

| Constraint | |
|---|---|
| UNIQUE | (family_id, name) |

---

### sprints
Спринты для планирования задач.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | Название ("Спринт 1", "Январь") |
| start_date | DATE | NOT NULL | Начало |
| end_date | DATE | NOT NULL | Конец |
| is_active | BOOLEAN | NOT NULL, default false | Текущий активный спринт |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### tags
Теги (общие для задач и идей).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| name | VARCHAR(50) | NOT NULL | Название тега |
| color | VARCHAR(7) | | HEX цвет (#FF5733) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

| Constraint | |
|---|---|
| UNIQUE | (family_id, name) |

---

### tasks
Задачи — основная сущность, самый сложный модуль.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| list_id | UUID | FK → task_lists.id | Список задач (null = без списка) |
| sprint_id | UUID | FK → sprints.id | Спринт (null = бэклог) |
| created_by | UUID | FK → users.id, NOT NULL | Кто создал |
| assigned_to | UUID | FK → users.id | На ком задача (null = общая) |
| title | VARCHAR(500) | NOT NULL | Название |
| description | TEXT | | Описание (Markdown) |
| status | VARCHAR(20) | NOT NULL, default 'new' | 'new', 'in_progress', 'done', 'archived' |
| priority | VARCHAR(10) | NOT NULL, default 'medium' | 'high', 'medium', 'low' |
| due_date | DATE | | Дедлайн (дата) |
| due_time | VARCHAR(5) | | Дедлайн (время, "HH:MM") |
| is_recurring | BOOLEAN | NOT NULL, default false | Повторяющаяся задача |
| recurrence_rule | JSONB | | Правило повторения: {"type":"weekly","days":[1,3,5]} |
| recurrence_parent_id | UUID | FK → tasks.id | Ссылка на оригинальную повторяющуюся задачу |
| sort_order | INT | NOT NULL, default 0 | Порядок в списке/колонке |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### subtasks
Подзадачи (чеклист внутри задачи).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| task_id | UUID | FK → tasks.id, NOT NULL, ON DELETE CASCADE | Родительская задача |
| title | VARCHAR(500) | NOT NULL | Текст подзадачи |
| is_done | BOOLEAN | NOT NULL, default false | Выполнена |
| sort_order | INT | NOT NULL, default 0 | Порядок |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### task_tags
Связь задач с тегами (M:N).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| task_id | UUID | FK → tasks.id, ON DELETE CASCADE | |
| tag_id | UUID | FK → tags.id, ON DELETE CASCADE | |

| Constraint | |
|---|---|
| PK | (task_id, tag_id) |

---

### task_comments
Комментарии к задачам.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| task_id | UUID | FK → tasks.id, NOT NULL, ON DELETE CASCADE | |
| user_id | UUID | FK → users.id, NOT NULL | Автор комментария |
| content | TEXT | NOT NULL | Текст (Markdown) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### task_reminders
Напоминания о задачах.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| task_id | UUID | FK → tasks.id, NOT NULL, ON DELETE CASCADE | |
| remind_at | TIMESTAMPTZ | NOT NULL | Когда напомнить |
| is_sent | BOOLEAN | NOT NULL, default false | Отправлено (показано) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### purchase_lists
Списки покупок ("Сільпо", "Аптека").

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | Название магазина/категории |
| sort_order | INT | NOT NULL, default 0 | Порядок |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

| Constraint | |
|---|---|
| UNIQUE | (family_id, name) |

---

### purchases
Товары в списке покупок.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| list_id | UUID | FK → purchase_lists.id, NOT NULL, ON DELETE CASCADE | |
| name | VARCHAR(300) | NOT NULL | Название товара |
| quantity | VARCHAR(50) | | Количество ("2 шт", "500г") |
| is_bought | BOOLEAN | NOT NULL, default false | Куплено |
| added_from_recipe_id | UUID | FK → recipes.id | Из какого рецепта добавлено (null если вручную) |
| sort_order | INT | NOT NULL, default 0 | Порядок |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### ideas
Идеи / быстрые заметки.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| created_by | UUID | FK → users.id, NOT NULL | Автор |
| title | VARCHAR(500) | NOT NULL | Заголовок |
| description | TEXT | | Описание (Markdown) |
| converted_to_type | VARCHAR(10) | | 'task' / 'project' / null |
| converted_to_id | UUID | | ID созданной задачи или проекта |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### idea_tags
Связь идей с тегами (M:N).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| idea_id | UUID | FK → ideas.id, ON DELETE CASCADE | |
| tag_id | UUID | FK → tags.id, ON DELETE CASCADE | |

| Constraint | |
|---|---|
| PK | (idea_id, tag_id) |

---

### recipes
Рецепты.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| created_by | UUID | FK → users.id, NOT NULL | Автор |
| title | VARCHAR(300) | NOT NULL | Название рецепта |
| description | TEXT | | Описание (Markdown) |
| instructions | TEXT | | Инструкция приготовления (Markdown) |
| image_url | TEXT | | Путь к фото |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### recipe_ingredients
Ингредиенты рецепта (отдельная таблица для "В покупки").

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| recipe_id | UUID | FK → recipes.id, NOT NULL, ON DELETE CASCADE | |
| name | VARCHAR(200) | NOT NULL | Название ингредиента |
| quantity | VARCHAR(50) | | Количество ("200г", "2 шт") |
| sort_order | INT | NOT NULL, default 0 | Порядок |

---

### projects
Проекты (комплексные цели).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| created_by | UUID | FK → users.id, NOT NULL | Автор |
| title | VARCHAR(300) | NOT NULL | Название проекта |
| description | TEXT | | Описание (Markdown) |
| status | VARCHAR(20) | NOT NULL, default 'active' | 'active', 'paused', 'completed' |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### project_items
Подзадачи / элементы проекта.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| project_id | UUID | FK → projects.id, NOT NULL, ON DELETE CASCADE | |
| family_id | UUID | FK → families.id, NOT NULL | Для RLS |
| title | VARCHAR(300) | NOT NULL | Название |
| status | VARCHAR(20) | NOT NULL, default 'pending' | 'pending', 'in_progress', 'done' |
| estimated_cost | DECIMAL(12,2) | | Ориентировочная стоимость |
| currency | VARCHAR(3) | default 'UAH' | 'UAH', 'USD' |
| url | TEXT | | Ссылка (на товар, референс) |
| sort_order | INT | NOT NULL, default 0 | Порядок |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### budget_categories
Категории бюджета (кастомные + дефолтные).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| name | VARCHAR(100) | NOT NULL | "Еда", "Транспорт", "Зарплата" |
| type | VARCHAR(10) | NOT NULL | 'income' / 'expense' |
| icon | VARCHAR(50) | | Иконка (название Lucide icon) |
| is_default | BOOLEAN | NOT NULL, default false | Системная категория |
| sort_order | INT | NOT NULL, default 0 | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

| Constraint | |
|---|---|
| UNIQUE | (family_id, name, type) |

---

### budget_transactions
Транзакции (доходы и расходы).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| category_id | UUID | FK → budget_categories.id, NOT NULL | Категория |
| user_id | UUID | FK → users.id, NOT NULL | Кто записал |
| type | VARCHAR(10) | NOT NULL | 'income' / 'expense' |
| amount | DECIMAL(12,2) | NOT NULL | Сумма |
| currency | VARCHAR(3) | NOT NULL, default 'UAH' | 'UAH', 'USD' |
| description | VARCHAR(300) | | Описание |
| date | DATE | NOT NULL | Дата транзакции |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### budget_recurring
Регулярные платежи (коммуналка, подписки).

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| category_id | UUID | FK → budget_categories.id, NOT NULL | Категория |
| title | VARCHAR(200) | NOT NULL | "Коммуналка", "Netflix" |
| amount | DECIMAL(12,2) | NOT NULL | Сумма |
| currency | VARCHAR(3) | NOT NULL, default 'UAH' | |
| period | VARCHAR(10) | NOT NULL | 'monthly', 'quarterly', 'yearly' |
| next_date | DATE | NOT NULL | Следующая дата платежа |
| is_active | BOOLEAN | NOT NULL, default true | Активен |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### budget_planned
Запланированные расходы.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| family_id | UUID | FK → families.id, NOT NULL | |
| category_id | UUID | FK → budget_categories.id | Категория (опционально) |
| title | VARCHAR(200) | NOT NULL | "Новый телевизор" |
| amount | DECIMAL(12,2) | NOT NULL | Примерная сумма |
| currency | VARCHAR(3) | NOT NULL, default 'UAH' | |
| target_date | DATE | | Когда планируем |
| is_completed | BOOLEAN | NOT NULL, default false | Совершена покупка |
| transaction_id | UUID | FK → budget_transactions.id | Ссылка на реальную транзакцию (когда совершена) |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

### notifications
In-app уведомления.

| Поле | Тип | Constraints | Описание |
|------|-----|-------------|----------|
| id | UUID | PK | |
| user_id | UUID | FK → users.id, NOT NULL | Кому |
| family_id | UUID | FK → families.id, NOT NULL | |
| type | VARCHAR(30) | NOT NULL | 'task_reminder', 'payment_due', 'task_assigned', 'comment' |
| title | VARCHAR(300) | NOT NULL | Заголовок |
| body | TEXT | | Текст |
| reference_type | VARCHAR(20) | | 'task', 'budget_recurring', etc. |
| reference_id | UUID | | ID связанной сущности |
| is_read | BOOLEAN | NOT NULL, default false | Прочитано |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |

---

## Связи

```
families 1:N users (family_id)
families 1:N task_lists (family_id)
families 1:N sprints (family_id)
families 1:N tags (family_id)
families 1:N tasks (family_id)
families 1:N purchase_lists (family_id)
families 1:N purchases (family_id)
families 1:N ideas (family_id)
families 1:N recipes (family_id)
families 1:N projects (family_id)
families 1:N budget_categories (family_id)
families 1:N budget_transactions (family_id)
families 1:N budget_recurring (family_id)
families 1:N budget_planned (family_id)
families 1:N notifications (family_id)

users 1:N tasks.created_by
users 1:N tasks.assigned_to
users 1:N task_comments (user_id)
users 1:N ideas.created_by
users 1:N recipes.created_by
users 1:N projects.created_by
users 1:N budget_transactions (user_id)
users 1:N notifications (user_id)
users 1:N invites.created_by

task_lists 1:N tasks (list_id)
sprints 1:N tasks (sprint_id)
tasks 1:N subtasks (task_id) CASCADE
tasks 1:N task_comments (task_id) CASCADE
tasks 1:N task_reminders (task_id) CASCADE
tasks M:N tags (через task_tags)
tasks 1:N tasks.recurrence_parent_id (самоссылка)

purchase_lists 1:N purchases (list_id) CASCADE
recipes 1:N recipe_ingredients (recipe_id) CASCADE
recipes 1:N purchases.added_from_recipe_id

ideas M:N tags (через idea_tags)

projects 1:N project_items (project_id) CASCADE

budget_categories 1:N budget_transactions (category_id)
budget_categories 1:N budget_recurring (category_id)
budget_categories 1:N budget_planned (category_id)
budget_planned 1:1 budget_transactions (transaction_id)
```

## Индексы

### Основные (performance)
```
users: UNIQUE (email)
users: INDEX (family_id)

tasks: INDEX (family_id, status)
tasks: INDEX (family_id, list_id)
tasks: INDEX (family_id, assigned_to)
tasks: INDEX (family_id, sprint_id)
tasks: INDEX (family_id, due_date) WHERE status != 'archived'
tasks: INDEX (recurrence_parent_id) WHERE is_recurring = true

subtasks: INDEX (task_id)
task_comments: INDEX (task_id, created_at)
task_reminders: INDEX (remind_at) WHERE is_sent = false

purchases: INDEX (family_id, list_id)
purchase_lists: INDEX (family_id)

ideas: INDEX (family_id)
recipes: INDEX (family_id)
projects: INDEX (family_id)
project_items: INDEX (project_id)

budget_transactions: INDEX (family_id, date)
budget_transactions: INDEX (family_id, category_id, date)
budget_recurring: INDEX (family_id, next_date) WHERE is_active = true
budget_planned: INDEX (family_id) WHERE is_completed = false

notifications: INDEX (user_id, is_read, created_at)

invites: UNIQUE (code)
invites: INDEX (family_id)
```

## Дефолтные данные

### Budget Categories (создаются при создании семьи)
**Расходы:** Еда, Транспорт, Жильё/Коммуналка, Здоровье, Одежда, Развлечения, Подписки, Дети, Другое
**Доходы:** Зарплата, Фриланс, Другое

### Task Lists (создаются при создании семьи)
"Загальні" (общий список по умолчанию)

## Стратегия изоляции данных

Каждая таблица с данными содержит `family_id`. Все запросы в server services ОБЯЗАНЫ включать `WHERE family_id = ?`. Это обеспечивает:
- Семья A не видит данные семьи B
- При будущем SaaS — полная изоляция без изменений
- Prisma middleware может автоматически добавлять family_id фильтр
