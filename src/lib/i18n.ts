export type Locale = 'ua' | 'en'

const ua = {
  // App
  appName: 'Сімейний планувальник',
  appDescription: 'Планувальник для родини',

  // Auth
  email: 'Email',
  password: 'Пароль',
  login: 'Увійти',
  loggingIn: 'Вхід...',
  loginError: 'Невірний email або пароль',

  // Nav
  navPurchases: 'Покупки',
  navTasks: 'Завдання',
  navProjects: 'Проєкти',
  navIdeas: 'Ідеї',

  // Common
  cancel: 'Скасувати',
  save: 'Зберегти',
  delete: 'Видалити',
  add: 'Додати',
  create: 'Створити',
  edit: 'Редагувати',
  name: 'Назва',
  description: 'Опис',
  noData: 'Немає даних',
  changeTheme: 'Змінити тему',
  quantity: 'Кількість',

  // Purchases
  purchasesEmpty: 'Списків поки немає',
  purchasesEmptySub: 'Створіть перший список покупок',
  purchasesCreateList: 'Створити список',
  purchasesNewList: 'Новий список',
  purchasesListNamePlaceholder: 'Назва...',
  purchasesListExample: 'Наприклад: Сільпо, Аптека...',
  purchasesAddItem: 'Додати товар...',
  purchasesQty: 'к-сть',
  purchasesQtyPlaceholder: 'напр. 2 шт, 500 г',
  purchasesEditItem: 'Редагувати товар',
  purchasesDeleteList: 'Видалити список?',
  purchasesDeleteListMsg: (name: string, count: number) =>
    `Список "${name}" та ${count > 0 ? `${count} товар(и/ів)` : 'усі товари'} будуть видалені назавжди.`,
  purchasesEmptyList: 'Список порожній.',
  purchasesEmptyListSub: 'Додайте перший товар!',

  // Tasks
  tasksEmpty: 'Завдань поки немає',
  tasksEmptySub: 'Створіть перше завдання',
  tasksAddTask: 'Додати завдання',
  tasksNewTask: 'Нове завдання',
  tasksEditTask: 'Редагувати завдання',
  tasksNamePlaceholder: 'Що потрібно зробити?',
  tasksDescPlaceholder: 'Деталі завдання...',
  tasksDeadline: 'Дедлайн',
  tasksNoDeadline: 'Без дедлайну',
  tasksPriority: 'Пріоритет',
  tasksStatus: 'Статус',
  tasksOverdue: 'Прострочено: ',
  tasksDragHere: 'Перетягніть сюди',
  tasksNoTasks: 'Немає завдань',
  tasksList: 'Список',
  tasksKanban: 'Канбан',
  tasksDefaultList: 'Загальні',
  tasksNewList: 'Новий список',
  tasksAllLists: 'Усі',
  tasksSelectList: 'Список',

  // Common lists
  rename: 'Перейменувати',
  renameList: 'Перейменувати список',
  newName: 'Нова назва',
  listNamePlaceholder: 'Назва списку...',

  // Task statuses
  statusNew: 'Нові',
  statusInProgress: 'В процесі',
  statusDone: 'Виконано',
  statusArchived: 'Архів',

  // Task priorities
  priorityHigh: 'Високий',
  priorityMedium: 'Середній',
  priorityLow: 'Низький',

  // Projects
  projectsTitle: 'Проєкти',
  projectsPlaceholder: 'Модуль буде додано на Етапі 6.',

  // Ideas
  ideasTitle: 'Ідеї',
  ideasPlaceholder: 'Модуль буде додано на Етапі 7.',

  // Errors
  profileNotFound: 'Профіль не знайдено. Запустіть SQL-скрипт для створення профілів.',
  loadError: (msg: string) => `Помилка завантаження: ${msg}`,
}

type Strings = {
  [K in keyof typeof ua]: (typeof ua)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string
}

const en: Strings = {
  appName: 'Family Planner',
  appDescription: 'Family planner app',
  email: 'Email',
  password: 'Password',
  login: 'Log in',
  loggingIn: 'Logging in...',
  loginError: 'Invalid email or password',
  navPurchases: 'Purchases',
  navTasks: 'Tasks',
  navProjects: 'Projects',
  navIdeas: 'Ideas',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  add: 'Add',
  create: 'Create',
  edit: 'Edit',
  name: 'Name',
  description: 'Description',
  noData: 'No data',
  changeTheme: 'Change theme',
  quantity: 'Quantity',
  purchasesEmpty: 'No lists yet',
  purchasesEmptySub: 'Create your first shopping list',
  purchasesCreateList: 'Create list',
  purchasesNewList: 'New list',
  purchasesListNamePlaceholder: 'Name...',
  purchasesListExample: 'E.g.: Grocery, Pharmacy...',
  purchasesAddItem: 'Add item...',
  purchasesQty: 'qty',
  purchasesQtyPlaceholder: 'e.g. 2 pcs, 500 g',
  purchasesEditItem: 'Edit item',
  purchasesDeleteList: 'Delete list?',
  purchasesDeleteListMsg: (name: string, count: number) =>
    `List "${name}" and ${count > 0 ? `${count} item(s)` : 'all items'} will be permanently deleted.`,
  purchasesEmptyList: 'List is empty.',
  purchasesEmptyListSub: 'Add the first item!',
  tasksEmpty: 'No tasks yet',
  tasksEmptySub: 'Create your first task',
  tasksAddTask: 'Add task',
  tasksNewTask: 'New task',
  tasksEditTask: 'Edit task',
  tasksNamePlaceholder: 'What needs to be done?',
  tasksDescPlaceholder: 'Task details...',
  tasksDeadline: 'Deadline',
  tasksNoDeadline: 'No deadline',
  tasksPriority: 'Priority',
  tasksStatus: 'Status',
  tasksOverdue: 'Overdue: ',
  tasksDragHere: 'Drag here',
  tasksNoTasks: 'No tasks',
  tasksList: 'List',
  tasksKanban: 'Kanban',
  tasksDefaultList: 'General',
  tasksNewList: 'New list',
  tasksAllLists: 'All',
  tasksSelectList: 'List',
  rename: 'Rename',
  renameList: 'Rename list',
  newName: 'New name',
  listNamePlaceholder: 'List name...',
  statusNew: 'New',
  statusInProgress: 'In progress',
  statusDone: 'Done',
  statusArchived: 'Archived',
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',
  projectsTitle: 'Projects',
  projectsPlaceholder: 'Module will be added in Stage 6.',
  ideasTitle: 'Ideas',
  ideasPlaceholder: 'Module will be added in Stage 7.',
  profileNotFound: 'Profile not found. Run SQL script to create profiles.',
  loadError: (msg: string) => `Loading error: ${msg}`,
}

const locales: Record<Locale, Strings> = { ua, en }

export function t<K extends keyof Strings>(key: K): Strings[K] {
  return locales['ua'][key]
}

export const strings: Strings = ua
