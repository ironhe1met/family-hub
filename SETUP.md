# Family Planner — Setup Guide

## Prerequisites

| Tool | Install |
|------|---------|
| **Node.js** (20+) | `curl -fsSL https://deb.nodesource.com/setup_20.x \| sudo bash - && sudo apt install nodejs` |
| **PM2** | `sudo npm install -g pm2` |
| **PostgreSQL client** | `sudo apt install postgresql-client` (for migrations) |
| **Git** | `sudo apt install git` |

## 1. Clone & Enter

```bash
git clone https://github.com/YOUR_USER/family-hub.git family_planner
cd family_planner
```

## 2. Create Environment Files

There are 3 env files. Copy examples and fill in your values:

### `.env.local` — Next.js (Supabase API keys)

```bash
cp .env.local.example .env.local
nano .env.local
```

| Variable | Where to find | Example |
|----------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard -> Settings -> API -> Project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard -> Settings -> API -> anon public | `eyJhbGci...` |

### `.env.supabase` — Database migrations (PostgreSQL)

```bash
cp .env.supabase.example .env.supabase
nano .env.supabase
```

| Variable | Where to find | Example |
|----------|---------------|---------|
| `SUPABASE_DB_URL` | Supabase Dashboard -> Settings -> Database -> Connection string -> URI | `postgresql://postgres.xxx:password@aws-0-eu.pooler.supabase.com:6543/postgres` |

### `.env.git` — Git push automation (optional)

```bash
cp .env.git.example .env.git
nano .env.git
```

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | GitHub Personal Access Token (Settings -> Developer -> Tokens) |
| `GITHUB_USER` | Your GitHub username |
| `GITHUB_REPO` | Repository name (e.g. `family-hub`) |

## 3. First Deploy

```bash
chmod +x deploy.sh migrate.sh push.sh
./deploy.sh
```

This will:
1. Check environment (.env.local, Node.js, PM2)
2. Install npm dependencies
3. Run database migrations (creates tables if needed)
4. Build the Next.js app
5. Start the PM2 process

## 4. Verify

```bash
pm2 status              # should show "family-app" as online
pm2 logs family-app     # check for errors
curl http://localhost:3000  # should respond
```

## 5. First User Setup (Supabase)

1. Go to Supabase Dashboard -> Authentication -> Users
2. Click "Add user" -> Create a user with email/password
3. Open your app in browser -> Login with that email/password
4. A profile with `family_id` will be auto-created

### Adding family members

To add a second user to the same family:
1. Find the first user's `family_id` in Supabase -> Table Editor -> profiles
2. Create a new user in Authentication
3. In Table Editor -> profiles, update the new user's `family_id` to match

## Daily Operations

| Command | What it does |
|---------|-------------|
| `./deploy.sh` | Full deploy: pull, install, migrate, build, restart |
| `./push.sh "message"` | Git add, commit, push to GitHub |
| `./migrate.sh` | Run pending database migrations only |
| `pm2 logs family-app` | View app logs |
| `pm2 restart family-app` | Restart without rebuild |

## File Structure

```
.env.local              # Supabase API keys (REQUIRED)
.env.supabase           # DB connection for migrations (REQUIRED for auto-migrate)
.env.git                # GitHub token for push.sh (OPTIONAL)
deploy.sh               # Full deploy script
migrate.sh              # Database migration runner
push.sh                 # Git push helper
supabase/migrations/    # Numbered SQL migration files
  000_migrations_table.sql
  001_initial_schema.sql
  002_task_description.sql
  ...
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `psql: command not found` | `sudo apt install postgresql-client` |
| Migrations skip silently | Check `.env.supabase` has correct `SUPABASE_DB_URL` |
| App shows blank page | Check `pm2 logs family-app` for errors |
| Can't login | Verify user exists in Supabase Authentication |
| Data not syncing | Check Supabase Dashboard -> Realtime -> enabled tables |
