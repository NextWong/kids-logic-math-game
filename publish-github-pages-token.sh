#!/usr/bin/env bash
set -euo pipefail

REPO_NAME="${1:-kids-logic-math-game}"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI is not installed. Install it first: https://cli.github.com/"
  exit 1
fi

echo "Create a GitHub classic token with scopes: repo, workflow, read:org, gist"
echo "Token page: https://github.com/settings/tokens"
printf "Paste GitHub token (hidden): "
IFS= read -rs GITHUB_TOKEN
printf "\n"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "No token entered."
  exit 1
fi

printf "%s" "$GITHUB_TOKEN" | gh auth login --hostname github.com --with-token
unset GITHUB_TOKEN

bash publish-github-pages.sh "$REPO_NAME"
