#!/usr/bin/env bash
set -euo pipefail

# ─── Family Planner — Deploy Script ──────────────────────────────────────────
# Usage: chmod +x deploy.sh && ./deploy.sh

APP_NAME="family-app"
ENV_FILE=".env.local"

# ─── Helpers ─────────────────────────────────────────────────────────────────

step()    { echo -e "\n🔹 $1"; }
success() { echo -e "✅ $1"; }
fail()    { echo -e "❌ $1" >&2; exit 1; }

START_TIME=$(date +%s)

echo "═══════════════════════════════════════════"
echo "🚀 Family Planner — Деплой"
echo "═══════════════════════════════════════════"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"

# ─── 1. Проверка окружения ───────────────────────────────────────────────────

step "Проверка окружения..."

if [ ! -f "$ENV_FILE" ]; then
  fail "Файл $ENV_FILE не найден! Билд упадёт без ключей Supabase.\n   Создайте $ENV_FILE с переменными NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY."
fi

if ! command -v node &> /dev/null; then
  fail "Node.js не установлен!"
fi

if ! command -v pm2 &> /dev/null; then
  fail "PM2 не установлен! Установите: npm install -g pm2"
fi

success "Окружение в порядке (Node $(node -v), PM2 $(pm2 -v))"

# ─── 2. Обновление кода ─────────────────────────────────────────────────────

step "Обновление кода из git..."

if git rev-parse --is-inside-work-tree &> /dev/null; then
  git pull --ff-only
  success "Код обновлён ($(git log -1 --format='%h %s'))"
else
  echo "⚠️  Не git-репозиторий, пропускаю git pull"
fi

# ─── 3. Установка зависимостей ───────────────────────────────────────────────

step "Установка зависимостей..."
npm install --prefer-offline --no-audit --no-fund
success "Зависимости установлены"

# ─── 4. Сборка проекта ──────────────────────────────────────────────────────

step "Сборка проекта..."
npm run build
success "Сборка завершена"

# ─── 5. Запуск / перезапуск PM2 ─────────────────────────────────────────────

step "Запуск приложения через PM2..."

if pm2 describe "$APP_NAME" &> /dev/null; then
  pm2 restart "$APP_NAME"
  success "Процесс $APP_NAME перезапущен"
else
  pm2 start npm --name "$APP_NAME" -- start
  success "Процесс $APP_NAME запущен впервые"
fi

pm2 save --force 2>/dev/null || true

# ─── 6. Очистка кэша ────────────────────────────────────────────────────────

step "Очистка временных файлов..."
rm -rf .next/cache/fetch-cache 2>/dev/null || true
success "Кэш очищен"

# ─── Готово ──────────────────────────────────────────────────────────────────

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "═══════════════════════════════════════════"
echo "🎉 Деплой завершён за ${ELAPSED}с"
echo "🌐 Приложение: http://localhost:3000"
echo "📊 PM2 статус: pm2 status"
echo "📋 Логи: pm2 logs $APP_NAME"
echo "═══════════════════════════════════════════"
