#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-kids-logic-math-game}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not installed. Install it first: https://cli.github.com/"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "GitHub CLI is not authenticated."
  echo "Run: gh auth login -h github.com -w"
  exit 1
fi

GH_USER="$(gh api user -q .login)"

if [ ! -d .git ]; then
  git init -b main
else
  git branch -M main
fi

if ! git config user.name >/dev/null 2>&1; then
  git config user.name "$GH_USER"
fi

if ! git config user.email >/dev/null 2>&1; then
  git config user.email "${GH_USER}@users.noreply.github.com"
fi

git add .

if ! git diff --cached --quiet; then
  git commit -m "Publish kids math game to GitHub Pages"
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --public --source=. --remote=origin
fi

FULL_NAME="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

gh api --method POST "repos/${FULL_NAME}/pages" -f build_type=workflow >/dev/null 2>&1 || true
git push -u origin main

OWNER="${FULL_NAME%%/*}"
echo
echo "GitHub Pages is deploying."
echo "Actions: https://github.com/${FULL_NAME}/actions"
echo "Family link: https://${OWNER}.github.io/${REPO_NAME}/"
