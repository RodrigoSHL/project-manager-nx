#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BACKUP_BASE=${ATOMDEV_BACKUP_BASE:-/home/ubuntu/backups}
OCI_PYTHON=${ATOMDEV_OCI_PYTHON:-/home/ubuntu/.local/oci-cli-venv/bin/python}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
DAY=$(date -u +%Y-%m-%d)
OBJECT_NAME="daily/$DAY/atomdev-prod-$STAMP.tar"

command -v docker >/dev/null
command -v gzip >/dev/null
command -v flock >/dev/null
test -x "$OCI_PYTHON"
test -f "$ROOT_DIR/.env.deploy"
test -f "$ROOT_DIR/docker-compose.prod.yml"
test -f "$ROOT_DIR/docker/Caddyfile"

mkdir -p "$BACKUP_BASE"
exec 9>"$BACKUP_BASE/.offsite-backup.lock"
flock -n 9 || { echo "Ya hay un respaldo externo en ejecución" >&2; exit 1; }

WORK_DIR=$(mktemp -d "$BACKUP_BASE/offsite.XXXXXXXX")
cleanup() {
  status=$?
  if (( status != 0 )); then
    echo "Falló el respaldo externo $STAMP (código $status)" >&2
  fi
  if [[ -n "${WORK_DIR:-}" && -d "$WORK_DIR" ]]; then
    rm -rf -- "$WORK_DIR"
  fi
}
trap cleanup EXIT

mkdir "$WORK_DIR/payload"
POSTGRES_CONTAINER=$(docker compose --env-file "$ROOT_DIR/.env.deploy" \
  -f "$ROOT_DIR/docker-compose.prod.yml" ps -q postgres)
test -n "$POSTGRES_CONTAINER"

docker exec "$POSTGRES_CONTAINER" sh -c 'pg_dumpall -U "$POSTGRES_USER"' \
  | gzip -1 > "$WORK_DIR/payload/postgres-all.sql.gz"
test -s "$WORK_DIR/payload/postgres-all.sql.gz"
gzip -t "$WORK_DIR/payload/postgres-all.sql.gz"

cp -p "$ROOT_DIR/.env.deploy" "$WORK_DIR/payload/.env.deploy"
cp -p "$ROOT_DIR/docker-compose.prod.yml" "$WORK_DIR/payload/docker-compose.prod.yml"
cp -p "$ROOT_DIR/docker/Caddyfile" "$WORK_DIR/payload/Caddyfile"
printf 'created_utc=%s\nsource=atomdev-server\nformat=pg_dumpall+config\n' \
  "$STAMP" > "$WORK_DIR/payload/BACKUP_INFO"

(
  cd "$WORK_DIR/payload"
  sha256sum postgres-all.sql.gz .env.deploy docker-compose.prod.yml \
    Caddyfile BACKUP_INFO > SHA256SUMS
  sha256sum -c SHA256SUMS >/dev/null
)

ARCHIVE="$WORK_DIR/atomdev-prod-$STAMP.tar"
tar -C "$WORK_DIR/payload" -cf "$ARCHIVE" \
  postgres-all.sql.gz .env.deploy docker-compose.prod.yml Caddyfile BACKUP_INFO SHA256SUMS
tar -tf "$ARCHIVE" >/dev/null

"$OCI_PYTHON" "$ROOT_DIR/scripts/oci-backup-object.py" \
  upload "$ARCHIVE" "$OBJECT_NAME"

BYTES=$(stat -c '%s' "$ARCHIVE")
printf '{"created_utc":"%s","object":"%s","bytes":%s}\n' \
  "$STAMP" "$OBJECT_NAME" "$BYTES" > "$WORK_DIR/last-success.json"
install -m 600 "$WORK_DIR/last-success.json" "$BACKUP_BASE/offsite-last-success.json"
echo "Respaldo externo completo: $OBJECT_NAME ($BYTES bytes)"
