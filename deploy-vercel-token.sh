#!/usr/bin/env bash
set -euo pipefail

if ! command -v vercel >/dev/null 2>&1; then
  echo "Vercel CLI is not installed. Run: npm install -g vercel"
  exit 1
fi

echo "Create a token at: https://vercel.com/account/tokens"
printf "Paste Vercel token (hidden): "
IFS= read -rs VERCEL_TOKEN
printf "\n"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "No token entered."
  exit 1
fi

echo "Deploying preview..."
vercel deploy . --yes --token "$VERCEL_TOKEN"
