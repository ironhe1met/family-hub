type Locale = 'uk' | 'en'

const translations = {
  uk: {
    // App
    appName: 'Family Hub',

    // Navigation
    navTasks: 'Задачі',
    navProjects: 'Проєкти',
    navPurchases: 'Покупки',
    navRecipes: 'Рецепти',
    navBudget: 'Бюджет',
    navIdeas: 'Ідеї',
    navSettings: 'Налаштування',

    // Auth
    login: 'Увійти',
    register: 'Зареєструватися',
    logout: 'Вийти',
    email: 'Електронна пошта',
    password: 'Пароль',
    firstName: "Ім'я",
    familyName: 'Назва сім\'ї',
    noAccount: 'Немає акаунту?',
    hasAccount: 'Вже є акаунт?',
    joinFamily: 'Приєднуєтесь до сім\'ї',

    // Common
    save: 'Зберегти',
    cancel: 'Скасувати',
    delete: 'Видалити',
    edit: 'Редагувати',
    add: 'Додати',
    search: 'Пошук',
    loading: 'Завантаження...',
    noResults: 'Нічого не знайдено',
    undo: 'Відмінити',
    deleted: 'Видалено',

    // Tasks
    tasksTitle: 'Задачі',
    tasksEmpty: 'Задач поки немає',
    tasksEmptyHint: 'Створіть першу задачу',
    taskNew: 'Нова',
    taskInProgress: 'В роботі',
    taskDone: 'Виконана',
    taskArchived: 'Архів',
    priorityHigh: 'Високий',
    priorityMedium: 'Середній',
    priorityLow: 'Низький',

    // Purchases
    purchasesTitle: 'Покупки',
    purchasesEmpty: 'Список порожній',
    purchasesEmptyHint: 'Додайте перший товар',
    addItem: 'Додати товар...',

    // Ideas
    ideasTitle: 'Ідеї',
    ideasEmpty: 'Ідей поки немає',
    ideasEmptyHint: 'Запишіть першу ідею',
    convertToTask: '→ Задача',
    convertToProject: '→ Проєкт',

    // Recipes
    recipesTitle: 'Рецепти',
    recipesEmpty: 'Рецептів поки немає',
    toPurchases: 'В покупки',

    // Projects
    projectsTitle: 'Проєкти',
    projectsEmpty: 'Проєктів поки немає',
    statusActive: 'Активний',
    statusPaused: 'На паузі',
    statusCompleted: 'Завершений',

    // Budget
    budgetTitle: 'Бюджет',
    income: 'Дохід',
    expense: 'Витрати',
    balance: 'Залишок',
    transactions: 'Транзакції',
    recurring: 'Регулярні',
    planned: 'Заплановані',
    paid: 'Сплачено',

    // Settings
    settingsTitle: 'Налаштування',
    profile: 'Профіль',
    family: 'Сім\'я',
    inviteToFamily: 'Запросити в сім\'ю',
    changePassword: 'Змінити пароль',
    language: 'Мова',
    theme: 'Тема',
    themeDark: 'Темна',
    themeLight: 'Світла',

    // Notifications
    notifications: 'Сповіщення',
    markAllRead: 'Позначити всі як прочитані',
    noNotifications: 'Сповіщень немає',
  },
  en: {
    appName: 'Family Hub',

    navTasks: 'Tasks',
    navProjects: 'Projects',
    navPurchases: 'Purchases',
    navRecipes: 'Recipes',
    navBudget: 'Budget',
    navIdeas: 'Ideas',
    navSettings: 'Settings',

    login: 'Log in',
    register: 'Sign up',
    logout: 'Log out',
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    familyName: 'Family name',
    noAccount: 'No account?',
    hasAccount: 'Already have an account?',
    joinFamily: 'Joining family',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    noResults: 'Nothing found',
    undo: 'Undo',
    deleted: 'Deleted',

    tasksTitle: 'Tasks',
    tasksEmpty: 'No tasks yet',
    tasksEmptyHint: 'Create your first task',
    taskNew: 'New',
    taskInProgress: 'In Progress',
    taskDone: 'Done',
    taskArchived: 'Archived',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',

    purchasesTitle: 'Purchases',
    purchasesEmpty: 'List is empty',
    purchasesEmptyHint: 'Add your first item',
    addItem: 'Add item...',

    ideasTitle: 'Ideas',
    ideasEmpty: 'No ideas yet',
    ideasEmptyHint: 'Write down your first idea',
    convertToTask: '→ Task',
    convertToProject: '→ Project',

    recipesTitle: 'Recipes',
    recipesEmpty: 'No recipes yet',
    toPurchases: 'To purchases',

    projectsTitle: 'Projects',
    projectsEmpty: 'No projects yet',
    statusActive: 'Active',
    statusPaused: 'Paused',
    statusCompleted: 'Completed',

    budgetTitle: 'Budget',
    income: 'Income',
    expense: 'Expenses',
    balance: 'Balance',
    transactions: 'Transactions',
    recurring: 'Recurring',
    planned: 'Planned',
    paid: 'Paid',

    settingsTitle: 'Settings',
    profile: 'Profile',
    family: 'Family',
    inviteToFamily: 'Invite to family',
    changePassword: 'Change password',
    language: 'Language',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',

    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications',
  },
} as const

let currentLocale: Locale = 'uk'

export function setLocale(locale: Locale) {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function t(key: keyof typeof translations.uk): string {
  return translations[currentLocale][key]
}

export const strings = translations
