#!/usr/bin/env bash

set -euo pipefail

SKILL_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
REPO_DIR=$(cd "$SKILL_DIR/../../.." && pwd)
REQUESTED_SLUG=${1:-}
REQUESTED_PORT=${2:-}
REQUESTED_DB=${3:-}
COLLISION=false

cd "$REPO_DIR"

printf 'Git status\n'
git status --short

printf '\nNx projects\n'
for project_file in apps/*/project.json; do
  [[ -f "$project_file" ]] || continue
  node -e 'const p=require("./"+process.argv[1]); console.log(`${p.name}\t${process.argv[1]}`)' "$project_file"
done | sort

printf '\nPorts and health checks\n'
rg -n '(^|[^A-Z_])(PORT|API_PORT|USER_API_PORT|BFF_PORT):|127\.0\.0\.1:[0-9]+|localhost:[0-9]+' \
  docker-compose.prod.yml apps/*/src/main.ts 2>/dev/null || true

printf '\nDatabase variables and initialization\n'
rg -n '[A-Z][A-Z0-9_]*(DB_NAME|DATABASE_NAME)|create_db_if_missing' \
  docker-compose.prod.yml docker/init-db.sh env.example env.deploy.example 2>/dev/null || true

printf '\nBFF service URLs and routes\n'
rg -n '[A-Z][A-Z0-9_]*_API_URL|SERVICE_ROUTES|Controller\(' \
  docker-compose.prod.yml apps/bff-api/src 2>/dev/null || true

printf '\nCaddy hosts\n'
rg -n '^[A-Za-z0-9_.*{},.$:-]+[[:space:]]*\{|_web\)|WEB_HOST' \
  docker/Caddyfile 2>/dev/null || true

printf '\nEnvironment variable names (values redacted)\n'
for env_file in .env .env.deploy; do
  [[ -f "$env_file" ]] || continue
  printf '%s\n' "$env_file"
  awk -F= '/^[A-Za-z_][A-Za-z0-9_]*=/{print "  "$1}' "$env_file" | sort
done

if [[ -n "$REQUESTED_SLUG" ]]; then
  if [[ -e "apps/$REQUESTED_SLUG" ]] || rg -q "\"name\"[[:space:]]*:[[:space:]]*\"$REQUESTED_SLUG\"" apps/*/project.json; then
    printf '\nCOLLISION: project slug already exists: %s\n' "$REQUESTED_SLUG" >&2
    COLLISION=true
  fi
fi

if [[ -n "$REQUESTED_PORT" ]] && rg -q "(^|[^0-9])$REQUESTED_PORT([^0-9]|$)" \
  docker-compose.prod.yml apps/*/src/main.ts; then
  printf '\nCOLLISION: port already appears in the workspace: %s\n' "$REQUESTED_PORT" >&2
  COLLISION=true
fi

if [[ -n "$REQUESTED_DB" ]] && rg -q "$REQUESTED_DB" \
  docker-compose.prod.yml docker/init-db.sh env.example env.deploy.example; then
  printf '\nCOLLISION: database name already appears in the workspace: %s\n' "$REQUESTED_DB" >&2
  COLLISION=true
fi

if [[ "$COLLISION" == true ]]; then
  exit 2
fi

if [[ -n "$REQUESTED_SLUG$REQUESTED_PORT$REQUESTED_DB" ]]; then
  printf '\nNo requested collisions detected.\n'
fi
