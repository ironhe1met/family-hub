#!/usr/bin/env bash
set -euo pipefail

# ─── Family Planner — Git Push Script ────────────────────────────────────────
# Usage: ./push.sh "commit message"

ENV_FILE=".env.git"

if [ ! -f "$ENV_FILE" ]; then
  echo "File $ENV_FILE not found!"
  echo "Copy .env.git.example to .env.git and fill in your credentials."
  exit 1
fi

source "$ENV_FILE"

if [ -z "${GITHUB_TOKEN:-}" ] || [ -z "${GITHUB_USER:-}" ] || [ -z "${GITHUB_REPO:-}" ]; then
  echo "Missing GITHUB_TOKEN, GITHUB_USER, or GITHUB_REPO in $ENV_FILE"
  exit 1
fi

MSG="${1:-auto commit $(date '+%Y-%m-%d %H:%M')}"

echo "Staging changes..."
git add -A

echo "Committing: $MSG"
git commit -m "$MSG" || { echo "Nothing to commit."; exit 0; }

REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"

echo "Pushing to GitHub..."
git push "$REMOTE_URL" HEAD:main

echo "Done!"
