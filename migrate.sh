#!/usr/bin/env bash
set -euo pipefail

# ─── Family Planner — Database Migration Script ─────────────────────────────
# Usage: ./migrate.sh
# Runs all pending SQL migrations from supabase/migrations/ in order.
# Tracks applied migrations in public._migrations table.

MIGRATIONS_DIR="supabase/migrations"
ENV_FILE=".env.supabase"

# ─── Load DB connection ─────────────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
  echo "File $ENV_FILE not found!"
  echo "Create it from .env.supabase.example with your Supabase DB connection string."
  echo "Skipping migrations."
  exit 0
fi

source "$ENV_FILE"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set in $ENV_FILE"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "psql not found. Install postgresql-client:"
  echo "  sudo apt install postgresql-client"
  echo "Skipping migrations."
  exit 0
fi

# ─── Ensure _migrations table exists ────────────────────────────────────────

INIT_FILE="$MIGRATIONS_DIR/000_migrations_table.sql"
if [ -f "$INIT_FILE" ]; then
  psql "$SUPABASE_DB_URL" -q -f "$INIT_FILE" 2>/dev/null || true
fi

# ─── Get list of already applied migrations ─────────────────────────────────

APPLIED=$(psql "$SUPABASE_DB_URL" -t -A -c "SELECT filename FROM public._migrations ORDER BY filename" 2>/dev/null || echo "")

# ─── Run pending migrations ─────────────────────────────────────────────────

PENDING=0

for file in "$MIGRATIONS_DIR"/*.sql; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")

  # Skip 000 (already handled above)
  [ "$filename" = "000_migrations_table.sql" ] && continue

  # Check if already applied
  if echo "$APPLIED" | grep -qx "$filename"; then
    continue
  fi

  echo "Applying: $filename"
  if psql "$SUPABASE_DB_URL" -q -f "$file"; then
    psql "$SUPABASE_DB_URL" -q -c "INSERT INTO public._migrations (filename) VALUES ('$filename')" 2>/dev/null
    echo "  Done."
    PENDING=$((PENDING + 1))
  else
    echo "  FAILED! Stopping."
    exit 1
  fi
done

if [ "$PENDING" -eq 0 ]; then
  echo "Database is up to date."
else
  echo "$PENDING migration(s) applied."
fi
