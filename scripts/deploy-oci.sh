#!/usr/bin/env bash

set -Eeo pipefail

# Deployment commands must stream output directly. Some terminal or Git/Docker
# configurations enable `less`, which captures the interactive terminal and
# makes the deployment look stalled at an `(END)` screen.
export PAGER=cat
export GIT_PAGER=cat
export SYSTEMD_PAGER=cat
export LESS='-FRX'

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
COMPOSE_FILE="docker-compose.prod.yml"
REMOTE_HOST="${ATOMDEV_SSH_HOST:-ubuntu@161.153.194.227}"
REMOTE_DIR="${ATOMDEV_REMOTE_DIR:-/home/ubuntu/project-manager-nx}"
EXPECTED_KEY_FINGERPRINT="${ATOMDEV_SSH_KEY_FINGERPRINT:-SHA256:3zW7BEoGyCNtIN3H0WPMEXDcE0J+TleWsuLBUH5toNE}"

DRY_RUN=false
ASSUME_YES=false
SKIP_LOCAL_BUILD=false
PROFILE=""
CUSTOM_SERVICES=""
SSH_KEY_SOURCE="${ATOMDEV_SSH_KEY:-}"
TEMP_KEY_DIR=""
SAFE_SSH_KEY=""
DEPLOY_STAMP=""
BACKUP_DIR=""

SERVICES=()
BUILD_SERVICES=()
DEPLOYED_SERVICES=()

CANONICAL_SERVICES=(
  project-api
  user-api
  travel-planner-api
  files-api
  bff-api
  project-web
  jira-web
  travel-planner-app
  atomdev-landing
  caddy
)

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

warn() {
  printf '\nADVERTENCIA: %s\n' "$*" >&2
}

die() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

usage() {
  cat <<'EOF'
Uso:
  npm run deploy:oci
  bash scripts/deploy-oci.sh [opciones]

Opciones:
  --profile PERFIL       travel-full, travel-frontend, travel-backend,
                         platform-full o custom
  --services LISTA       Servicios separados por coma; implica perfil custom
  --key RUTA             Clave privada SSH (también ATOMDEV_SSH_KEY)
  --dry-run              Preflight y rsync simulado; no cambia producción
  --skip-local-build     Omite el build Docker local (el build ARM64 remoto sigue)
                         Por defecto, el build local se ejecuta de forma secuencial
                         para no saturar Docker Desktop.
  --yes                  No solicitar confirmaciones; exige --profile/--services
  -h, --help             Mostrar esta ayuda

Variables opcionales:
  ATOMDEV_SSH_HOST, ATOMDEV_REMOTE_DIR, ATOMDEV_SSH_KEY,
  ATOMDEV_SSH_KEY_FINGERPRINT
EOF
}

cleanup() {
  local exit_status=$?
  if [[ -n "$TEMP_KEY_DIR" && -d "$TEMP_KEY_DIR" ]]; then
    rm -rf "$TEMP_KEY_DIR"
  fi
  return "$exit_status"
}

trap cleanup EXIT

confirm() {
  local prompt=$1
  local default_answer=${2:-n}
  local answer=""

  if [[ "$ASSUME_YES" == true ]]; then
    return 0
  fi

  if [[ "$default_answer" == y ]]; then
    read -r -p "$prompt [S/n]: " answer
    [[ -z "$answer" || "$answer" == s || "$answer" == S || "$answer" == y || "$answer" == Y ]]
  else
    read -r -p "$prompt [s/N]: " answer
    [[ "$answer" == s || "$answer" == S || "$answer" == y || "$answer" == Y ]]
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Falta el comando requerido: $1"
}

contains_service() {
  local expected=$1
  shift
  local current
  for current in "$@"; do
    [[ "$current" == "$expected" ]] && return 0
  done
  return 1
}

validate_service() {
  local candidate=$1
  contains_service "$candidate" "${CANONICAL_SERVICES[@]}" \
    || die "Servicio no permitido: $candidate"
}

select_profile_interactively() {
  local selection=""

  printf '\n¿Qué quieres desplegar?\n'
  printf '  1) Travel completo (User API, Travel API, Files API, BFF y frontend)\n'
  printf '  2) Solo frontend Travel\n'
  printf '  3) Backend Travel (User API, Travel API, Files API y BFF)\n'
  printf '  4) Plataforma completa (APIs, BFF y tres frontends)\n'
  printf '  5) Selección personalizada\n'
  read -r -p 'Selecciona [1-5]: ' selection

  case "$selection" in
    1) PROFILE="travel-full" ;;
    2) PROFILE="travel-frontend" ;;
    3) PROFILE="travel-backend" ;;
    4) PROFILE="platform-full" ;;
    5) PROFILE="custom" ;;
    *) die "Selección inválida" ;;
  esac
}

resolve_services() {
  local raw_services=""
  local item=""
  local ordered=""
  local requested_services=()

  if [[ -z "$PROFILE" ]]; then
    [[ "$ASSUME_YES" == false ]] || die "--yes requiere --profile o --services"
    select_profile_interactively
  fi

  case "$PROFILE" in
    travel-full)
      raw_services="user-api,travel-planner-api,files-api,bff-api,travel-planner-app"
      ;;
    travel-frontend)
      raw_services="travel-planner-app"
      ;;
    travel-backend)
      raw_services="user-api,travel-planner-api,files-api,bff-api"
      ;;
    platform-full)
      raw_services="project-api,user-api,travel-planner-api,files-api,bff-api,project-web,jira-web,travel-planner-app,atomdev-landing"
      ;;
    custom)
      raw_services="$CUSTOM_SERVICES"
      if [[ -z "$raw_services" ]]; then
        printf '\nServicios disponibles: %s\n' "${CANONICAL_SERVICES[*]}"
        read -r -p 'Servicios separados por coma: ' raw_services
      fi
      ;;
    *)
      die "Perfil desconocido: $PROFILE"
      ;;
  esac

  IFS=',' read -r -a requested_services <<< "$raw_services"
  [[ ${#requested_services[@]} -gt 0 ]] || die "No se seleccionaron servicios"

  for item in "${requested_services[@]}"; do
    item=$(printf '%s' "$item" | tr -d '[:space:]')
    [[ -n "$item" ]] || continue
    validate_service "$item"
    if ! contains_service "$item" "${SERVICES[@]}"; then
      SERVICES+=("$item")
    fi
  done

  requested_services=("${SERVICES[@]}")
  SERVICES=()
  for ordered in "${CANONICAL_SERVICES[@]}"; do
    if contains_service "$ordered" "${requested_services[@]}"; then
      SERVICES+=("$ordered")
      [[ "$ordered" == caddy ]] || BUILD_SERVICES+=("$ordered")
    fi
  done
}

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --profile)
        [[ $# -ge 2 ]] || die "--profile requiere un valor"
        PROFILE=$2
        shift 2
        ;;
      --services)
        [[ $# -ge 2 ]] || die "--services requiere un valor"
        PROFILE="custom"
        CUSTOM_SERVICES=$2
        shift 2
        ;;
      --key)
        [[ $# -ge 2 ]] || die "--key requiere una ruta"
        SSH_KEY_SOURCE=$2
        shift 2
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --skip-local-build)
        SKIP_LOCAL_BUILD=true
        shift
        ;;
      --yes)
        ASSUME_YES=true
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        die "Opción desconocida: $1"
        ;;
    esac
  done
}

resolve_ssh_key() {
  local candidates=()
  local fingerprint_line=""
  local actual_fingerprint=""
  local relative_key=""
  local source_mode=""

  if [[ -z "$SSH_KEY_SOURCE" ]]; then
    shopt -s nullglob
    candidates=("$ROOT_DIR"/*.key)
    shopt -u nullglob

    if [[ ${#candidates[@]} -eq 1 ]]; then
      SSH_KEY_SOURCE=${candidates[0]}
    elif [[ ${#candidates[@]} -gt 1 ]]; then
      printf '\nClaves encontradas:\n'
      local index=1
      local candidate
      for candidate in "${candidates[@]}"; do
        printf '  %d) %s\n' "$index" "$candidate"
        index=$((index + 1))
      done
      read -r -p 'Selecciona la clave: ' index
      [[ "$index" =~ ^[0-9]+$ ]] || die "Selección de clave inválida"
      (( index >= 1 && index <= ${#candidates[@]} )) || die "Selección de clave fuera de rango"
      SSH_KEY_SOURCE=${candidates[$((index - 1))]}
    fi
  fi

  [[ -n "$SSH_KEY_SOURCE" ]] || die "No se encontró una clave. Usa --key o ATOMDEV_SSH_KEY."
  [[ -f "$SSH_KEY_SOURCE" ]] || die "La clave no existe: $SSH_KEY_SOURCE"

  if [[ "$SSH_KEY_SOURCE" == "$ROOT_DIR"/* ]]; then
    relative_key=${SSH_KEY_SOURCE#"$ROOT_DIR"/}
    git -C "$ROOT_DIR" check-ignore -q "$relative_key" \
      || die "La clave está dentro del repo pero Git no la ignora: $SSH_KEY_SOURCE"
  fi

  source_mode=$(stat -f '%Lp' "$SSH_KEY_SOURCE" 2>/dev/null \
    || stat -c '%a' "$SSH_KEY_SOURCE" 2>/dev/null \
    || true)
  if [[ -n "$source_mode" && "$source_mode" != 600 && "$source_mode" != 400 ]]; then
    warn "La clave fuente tiene permisos $source_mode; se usará únicamente una copia temporal 0600"
  fi

  TEMP_KEY_DIR=$(mktemp -d "${TMPDIR:-/tmp}/atomdev-deploy.XXXXXX")
  SAFE_SSH_KEY="$TEMP_KEY_DIR/oci.key"
  install -m 600 "$SSH_KEY_SOURCE" "$SAFE_SSH_KEY"

  fingerprint_line=$(ssh-keygen -y -f "$SAFE_SSH_KEY" | ssh-keygen -lf -)
  actual_fingerprint=$(printf '%s\n' "$fingerprint_line" | awk '{print $2}')
  [[ "$actual_fingerprint" == "$EXPECTED_KEY_FINGERPRINT" ]] \
    || die "Fingerprint SSH inesperado: $actual_fingerprint"

  printf 'Clave OCI verificada: %s\n' "$actual_fingerprint"
}

ssh_base() {
  ssh \
    -i "$SAFE_SSH_KEY" \
    -o IdentitiesOnly=yes \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=20 \
    "$REMOTE_HOST" "$@"
}

remote_bash() {
  ssh_base bash -s -- "$@"
}

show_summary() {
  local commit
  commit=$(git -C "$ROOT_DIR" rev-parse --short HEAD)

  printf '\nResumen del despliegue\n'
  printf '  Perfil:       %s\n' "$PROFILE"
  printf '  Servicios:    %s\n' "${SERVICES[*]}"
  printf '  Commit local: %s\n' "$commit"
  printf '  Destino:      %s:%s\n' "$REMOTE_HOST" "$REMOTE_DIR"
  printf '  Clave:        %s\n' "$SSH_KEY_SOURCE"
  printf '  Dry run:      %s\n' "$DRY_RUN"

  if [[ -n "$(git -C "$ROOT_DIR" status --short)" ]]; then
    warn "El repositorio tiene cambios sin commit y rsync los incluirá:"
    git -C "$ROOT_DIR" status --short
    confirm "¿Continuar con cambios sin commit?" n \
      || die "Despliegue cancelado"
  fi
}

validate_local_config() {
  log "Validando Docker Compose local"
  (
    cd "$ROOT_DIR"
    DATABASE_PASSWORD=validation-only \
      JWT_SECRET=validation-only \
      NEXT_PUBLIC_API_URL=/api \
      NEXT_PUBLIC_BFF_URL= \
      docker compose -f "$COMPOSE_FILE" config --quiet
    git diff --check
  )
}

build_local_images() {
  [[ ${#BUILD_SERVICES[@]} -gt 0 ]] || return 0
  [[ "$SKIP_LOCAL_BUILD" == false ]] || {
    warn "Build Docker local omitido por --skip-local-build"
    return 0
  }

  if [[ "$ASSUME_YES" == false ]]; then
    confirm "¿Ejecutar build Docker local de ${BUILD_SERVICES[*]}?" y \
      || die "El build local es una puerta de validación; usa --skip-local-build para omitirlo explícitamente"
  fi

  log "Construyendo imágenes localmente de forma secuencial"
  (
    cd "$ROOT_DIR"
    export COMPOSE_PARALLEL_LIMIT=1
    export BUILDKIT_PROGRESS="${BUILDKIT_PROGRESS:-plain}"

    local service
    for service in "${BUILD_SERVICES[@]}"; do
      log "Build local: $service"
      DATABASE_PASSWORD=validation-only \
        JWT_SECRET=validation-only \
        NEXT_PUBLIC_API_URL=/api \
        NEXT_PUBLIC_BFF_URL= \
        docker compose -f "$COMPOSE_FILE" build "$service"
    done
  )
}

preflight_remote() {
  log "Ejecutando preflight remoto de solo lectura"
  remote_bash "$REMOTE_DIR" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
cd "$REMOTE_DIR"

test -f .env.deploy
test -f docker-compose.prod.yml
test "$(uname -m)" = "aarch64"

AVAILABLE_KB=$(df -Pk / | awk 'NR==2 {print $4}')
test "$AVAILABLE_KB" -gt 5242880

docker compose --env-file .env.deploy -f docker-compose.prod.yml config --quiet
docker compose --env-file .env.deploy -f docker-compose.prod.yml ps
df -h /

POSTGRES_CONTAINER=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q postgres)
test -n "$POSTGRES_CONTAINER"
test "$(docker inspect --format '{{.State.Health.Status}}' "$POSTGRES_CONTAINER")" = "healthy"

for SERVICE in project-api user-api travel-planner-api bff-api; do
  CONTAINER_ID=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q "$SERVICE")
  test -n "$CONTAINER_ID"
  test "$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_ID")" = "healthy"
done

for SERVICE in project-web jira-web travel-planner-app caddy; do
  CONTAINER_ID=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q "$SERVICE")
  test -n "$CONTAINER_ID"
  test "$(docker inspect --format '{{.State.Status}}' "$CONTAINER_ID")" = "running"
done

if sudo -n true 2>/dev/null; then
  SOCKETS=$(sudo ss -lnt)
else
  SOCKETS=$(ss -lnt)
fi
printf '%s\n' "$SOCKETS"

UNEXPECTED_PUBLIC_PORTS=$(printf '%s\n' "$SOCKETS" \
  | awk 'NR>1 && ($4 ~ /^0\.0\.0\.0:/ || $4 ~ /^\[::\]:/) {split($4,a,":"); port=a[length(a)]; if (port != 22 && port != 80 && port != 443) print port}' \
  | sort -u)
if [[ -n "$UNEXPECTED_PUBLIC_PORTS" ]]; then
  printf 'ADVERTENCIA: puertos públicos adicionales detectados: %s\n' "$UNEXPECTED_PUBLIC_PORTS" >&2
fi
REMOTE
}

rsync_repo() {
  local mode=${1:-apply}
  local rsync_args=(-azc --omit-dir-times)
  local rsync_shell="ssh -i $SAFE_SSH_KEY -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=accept-new"

  if [[ "$mode" == dry ]]; then
    rsync_args+=(--dry-run --itemize-changes --prune-empty-dirs)
    log "Comparando archivos con rsync (simulación)"
  else
    rsync_args+=(--itemize-changes --prune-empty-dirs)
    log "Sincronizando código sin secretos ni artefactos"
  fi

  (
    cd "$ROOT_DIR"
    rsync "${rsync_args[@]}" \
      -e "$rsync_shell" \
      --exclude='.git' \
      --exclude='node_modules' \
      --exclude='.nx' \
      --exclude='dist' \
      --exclude='.next' \
      --exclude='.env' \
      --exclude='.env.deploy' \
      --exclude='*.key' \
      --exclude='*.pem' \
      --exclude='.DS_Store' \
      ./ "$REMOTE_HOST:$REMOTE_DIR/"
  )
}

create_remote_backup() {
  DEPLOY_STAMP=$(date -u +%Y%m%dT%H%M%SZ)
  BACKUP_DIR="/home/ubuntu/backups/deploy-$DEPLOY_STAMP"
  log "Creando backup remoto y etiquetas rollback-$DEPLOY_STAMP"

  remote_bash "$REMOTE_DIR" "$DEPLOY_STAMP" "${SERVICES[@]}" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
DEPLOY_STAMP=$2
shift 2
SERVICES=("$@")
BACKUP_DIR="/home/ubuntu/backups/deploy-$DEPLOY_STAMP"

cd "$REMOTE_DIR"
umask 077
mkdir -p "$BACKUP_DIR"
cp -p .env.deploy "$BACKUP_DIR/.env.deploy"
cp -p docker-compose.prod.yml "$BACKUP_DIR/docker-compose.prod.yml"
cp -p docker/Caddyfile "$BACKUP_DIR/Caddyfile"

POSTGRES_CONTAINER=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q postgres)
docker exec "$POSTGRES_CONTAINER" sh -c 'pg_dumpall -U "$POSTGRES_USER"' \
  | gzip > "$BACKUP_DIR/postgres-all.sql.gz"
test -s "$BACKUP_DIR/postgres-all.sql.gz"
gzip -t "$BACKUP_DIR/postgres-all.sql.gz"

for SERVICE in "${SERVICES[@]}"; do
  IMAGE_ID=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml images -q "$SERVICE" 2>/dev/null || true)
  if [[ -n "$IMAGE_ID" ]]; then
    docker tag "$IMAGE_ID" "project-manager-nx-$SERVICE:rollback-$DEPLOY_STAMP"
  fi
done

test -s "$BACKUP_DIR/.env.deploy"
printf 'Backup verificado: %s\n' "$BACKUP_DIR"
REMOTE
}

validate_remote_sync() {
  remote_bash "$REMOTE_DIR" "$BACKUP_DIR" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
BACKUP_DIR=$2
cd "$REMOTE_DIR"
docker compose --env-file .env.deploy -f docker-compose.prod.yml config --quiet
cmp -s .env.deploy "$BACKUP_DIR/.env.deploy"
printf 'Sync remoto validado; .env.deploy no cambió.\n'
REMOTE
}

ensure_remote_databases() {
  contains_service files-api "${SERVICES[@]}" || return 0

  log "Comprobando la base de datos de files-api"
  remote_bash "$REMOTE_DIR" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
cd "$REMOTE_DIR"

set -a
# shellcheck disable=SC1091
source .env.deploy
set +a

FILES_DATABASE=${FILES_DB_NAME:-files_db}
[[ "$FILES_DATABASE" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] \
  || { printf 'FILES_DB_NAME no es un identificador PostgreSQL válido.\n' >&2; exit 1; }

POSTGRES_CONTAINER=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q postgres)
test -n "$POSTGRES_CONTAINER"

DATABASE_EXISTS=$(docker exec "$POSTGRES_CONTAINER" sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '\''$1'\''"' \
  sh "$FILES_DATABASE")

if [[ "$DATABASE_EXISTS" != 1 ]]; then
  docker exec "$POSTGRES_CONTAINER" sh -c \
    'createdb -U "$POSTGRES_USER" "$1"' sh "$FILES_DATABASE"
  printf 'Base de files-api creada después del backup.\n'
else
  printf 'Base de files-api ya existe.\n'
fi
REMOTE
}

build_remote_images() {
  [[ ${#BUILD_SERVICES[@]} -gt 0 ]] || return 0
  log "Construyendo imágenes ARM64 en OCI sin reemplazar contenedores"

  remote_bash "$REMOTE_DIR" "${BUILD_SERVICES[@]}" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
shift
cd "$REMOTE_DIR"
docker compose --env-file .env.deploy -f docker-compose.prod.yml build "$@"
REMOTE
}

deploy_remote_service() {
  local service=$1

  log "Desplegando $service"
  remote_bash "$REMOTE_DIR" "$service" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
SERVICE=$2
cd "$REMOTE_DIR"

if [[ "$SERVICE" == caddy ]]; then
  docker compose --env-file .env.deploy -f docker-compose.prod.yml \
    up -d --force-recreate --no-deps caddy
else
  docker compose --env-file .env.deploy -f docker-compose.prod.yml \
    up -d --no-deps "$SERVICE"
fi

CONTAINER_ID=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q "$SERVICE")
test -n "$CONTAINER_ID"

for CHECK_INDEX in $(seq 1 60); do
  STATUS=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$CONTAINER_ID")
  if [[ "$STATUS" == healthy || "$STATUS" == running ]]; then
    sleep 2
    docker inspect --format '{{.Name}} {{.Image}} {{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}' "$CONTAINER_ID"
    exit 0
  fi
  if [[ "$STATUS" == unhealthy || "$STATUS" == exited || "$STATUS" == dead ]]; then
    docker logs --tail 150 "$CONTAINER_ID"
    exit 1
  fi
  sleep 2
done

docker logs --tail 150 "$CONTAINER_ID"
exit 1
REMOTE
}

rollback_remote_services() {
  local rollback_targets=("$@")
  [[ ${#rollback_targets[@]} -gt 0 ]] || return 0

  warn "Restaurando contenedores con rollback-$DEPLOY_STAMP. La base de datos NO se restaura automáticamente."
  remote_bash "$REMOTE_DIR" "$DEPLOY_STAMP" "${rollback_targets[@]}" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
DEPLOY_STAMP=$2
shift 2
SERVICES=("$@")
BACKUP_DIR="/home/ubuntu/backups/deploy-$DEPLOY_STAMP"
cd "$REMOTE_DIR"

for SERVICE in "${SERVICES[@]}"; do
  if [[ "$SERVICE" == caddy ]]; then
    cp "$BACKUP_DIR/Caddyfile" docker/Caddyfile
    docker compose --env-file .env.deploy -f docker-compose.prod.yml \
      up -d --force-recreate --no-deps caddy
    continue
  fi

  ROLLBACK_IMAGE="project-manager-nx-$SERVICE:rollback-$DEPLOY_STAMP"
  docker image inspect "$ROLLBACK_IMAGE" >/dev/null
  docker tag "$ROLLBACK_IMAGE" "project-manager-nx-$SERVICE:latest"
  docker compose --env-file .env.deploy -f docker-compose.prod.yml \
    up -d --force-recreate --no-deps "$SERVICE"
done
REMOTE
}

deploy_services() {
  local service
  local rollback_targets=()
  local index

  for service in "${SERVICES[@]}"; do
    if deploy_remote_service "$service"; then
      DEPLOYED_SERVICES+=("$service")
      continue
    fi

    warn "Falló el despliegue de $service"
    rollback_targets+=("$service")
    for ((index=${#DEPLOYED_SERVICES[@]} - 1; index >= 0; index--)); do
      rollback_targets+=("${DEPLOYED_SERVICES[$index]}")
    done

    if confirm "¿Restaurar automáticamente las imágenes anteriores?" y; then
      rollback_remote_services "${rollback_targets[@]}"
    fi
    die "Despliegue interrumpido; revisa logs antes de reintentar"
  done
}

expect_http_status() {
  local label=$1
  local url=$2
  local expected=$3
  local status

  status=$(curl -sS --max-time 30 -o /dev/null -w '%{http_code}' "$url")
  printf '%s=%s\n' "$label" "$status"
  [[ ",$expected," == *",$status,"* ]] \
    || die "$url respondió $status; se esperaba uno de: $expected"
}

verify_remote() {
  log "Verificando contenedores, conectividad y bundles"
  remote_bash "$REMOTE_DIR" "${SERVICES[@]}" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
shift
SERVICES=("$@")
cd "$REMOTE_DIR"

docker compose --env-file .env.deploy -f docker-compose.prod.yml ps

BFF_CONTAINER=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q bff-api)
docker exec "$BFF_CONTAINER" node -e "Promise.all([fetch('http://127.0.0.1:3000/health'),fetch('http://127.0.0.1:3000/api/trips'),fetch('http://travel-planner-api:3003/api'),fetch('http://user-api:3001/api/health'),fetch('http://files-api:3004/api/health')]).then(r=>{console.log('BFF_HEALTH='+r[0].status);console.log('TRIPS_WITHOUT_JWT='+r[1].status);console.log('TRAVEL_UPSTREAM='+r[2].status);console.log('USER_UPSTREAM='+r[3].status);console.log('FILES_UPSTREAM='+r[4].status);if(r[0].status!==200||r[1].status!==401||r[2].status!==200||r[3].status!==200||r[4].status!==200)process.exit(1)})"

for SERVICE in "${SERVICES[@]}"; do
  CONTAINER_ID=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q "$SERVICE")
  test -n "$CONTAINER_ID"
  ERROR_COUNT=$(docker logs --since 10m "$CONTAINER_ID" 2>&1 | grep -Eic 'error|exception|fatal' || true)
  printf '%s RECENT_ERROR_LINES=%s\n' "$SERVICE" "$ERROR_COUNT"
done

if printf '%s\n' "${SERVICES[@]}" | grep -qx travel-planner-app; then
  TRAVEL_APP_CONTAINER=$(docker compose --env-file .env.deploy -f docker-compose.prod.yml ps -q travel-planner-app)
  docker exec "$TRAVEL_APP_CONTAINER" node -e "const fs=require('fs');const m=JSON.parse(fs.readFileSync('/app/.next/routes-manifest.json'));console.log('TRAVEL_REWRITE='+m.rewrites.afterFiles[0].destination)"
  if docker exec "$TRAVEL_APP_CONTAINER" grep -RIlE '161\.153\.194\.227|http://localhost:3000/api|http://bff-api:3000' /app/.next/static; then
    printf 'El bundle público contiene una URL prohibida.\n' >&2
    exit 1
  fi
  printf 'PUBLIC_BUNDLE_URL_CHECK=clean\n'
fi
REMOTE
}

verify_external() {
  log "Ejecutando smoke tests HTTPS externos"
  expect_http_status TRAVEL_ROOT https://travel.atomdev.cl/ 200
  expect_http_status TRAVEL_LOGIN https://travel.atomdev.cl/login 200
  expect_http_status TRAVEL_PUBLIC_AUTH https://travel.atomdev.cl/api/auth/public 200
  expect_http_status TRAVEL_TRIPS_WITHOUT_JWT https://travel.atomdev.cl/api/trips 401
  expect_http_status PROJECTS_ROOT https://projects.atomdev.cl/ 200
  expect_http_status JIRA_ROOT https://jira.atomdev.cl/ 200
  expect_http_status ATOMDEV_ROOT https://atomdev.cl/ 200
  expect_http_status ATOMDEV_WWW https://www.atomdev.cl/ 200

  local server_header
  server_header=$(curl -sSI --max-time 30 https://travel.atomdev.cl/ \
    | awk 'tolower($1)=="server:" {gsub(/\r/,""); print $2; exit}')
  [[ "$server_header" == cloudflare ]] || die "Travel no está respondiendo mediante Cloudflare"
  printf 'CLOUDFLARE=ok\n'

  if command -v dig >/dev/null 2>&1; then
    dig +short A travel.atomdev.cl
  fi
}

main() {
  local confirmation=""

  parse_args "$@"
  cd "$ROOT_DIR"

  require_command git
  require_command docker
  require_command ssh
  require_command ssh-keygen
  require_command rsync
  require_command curl
  require_command gzip
  docker compose version >/dev/null

  resolve_services
  resolve_ssh_key
  show_summary
  validate_local_config
  preflight_remote
  rsync_repo dry

  if [[ "$DRY_RUN" == true ]]; then
    log "Dry run terminado: producción no fue modificada"
    exit 0
  fi

  if [[ "$ASSUME_YES" == false ]]; then
    read -r -p 'Escribe DEPLOY para continuar: ' confirmation
    [[ "$confirmation" == DEPLOY ]] || die "Despliegue cancelado"
  fi

  build_local_images
  create_remote_backup
  rsync_repo apply
  validate_remote_sync
  ensure_remote_databases
  build_remote_images
  deploy_services
  verify_remote
  verify_external

  log "Despliegue completado"
  printf 'Backup: %s\n' "$BACKUP_DIR"
  printf 'Rollback images: rollback-%s\n' "$DEPLOY_STAMP"
}

main "$@"
