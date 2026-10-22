#!/usr/bin/env bash
set -Eeuo pipefail

# Restore a downloaded production backup into an isolated, disposable PostgreSQL.
umask 077
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BACKUP_BASE=${ATOMDEV_BACKUP_BASE:-/home/ubuntu/backups}
OCI_PYTHON=${ATOMDEV_OCI_PYTHON:-/home/ubuntu/.local/oci-cli-venv/bin/python}
OBJECT_NAME=${1:-}
if [[ -z "$OBJECT_NAME" ]]; then
  OBJECT_NAME=$("$OCI_PYTHON" -c 'import json, sys; print(json.load(open(sys.argv[1]))["object"])' \
    "$BACKUP_BASE/offsite-last-success.json")
fi

WORK_DIR=$(mktemp -d "$BACKUP_BASE/restore-test.XXXXXXXX")
CONTAINER="atomdev-restore-test-$$"
STAGE=download
cleanup() {
  status=$?
  docker stop "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf -- "$WORK_DIR"
  if (( status != 0 )); then
    echo "Falló la prueba de restauración en $STAGE (código $status)" >&2
  fi
}
trap cleanup EXIT

"$OCI_PYTHON" "$ROOT_DIR/scripts/oci-backup-object.py" \
  download "$WORK_DIR/backup.tar" "$OBJECT_NAME"
STAGE=integrity
tar -C "$WORK_DIR" -xf "$WORK_DIR/backup.tar"
(
  cd "$WORK_DIR"
  sha256sum -c SHA256SUMS
)
gzip -t "$WORK_DIR/postgres-all.sql.gz"

STAGE=start-postgres
docker run -d --rm --network none --name "$CONTAINER" \
  -e POSTGRES_USER=restore_admin \
  -e POSTGRES_HOST_AUTH_METHOD=trust \
  postgres:15-alpine >/dev/null

for attempt in {1..60}; do
  # The image briefly starts a bootstrap server, then stops it and starts the
  # final server. Do not mistake the bootstrap socket for readiness.
  if docker logs "$CONTAINER" 2>&1 | grep -q 'PostgreSQL init process complete' \
    && docker exec "$CONTAINER" pg_isready -U restore_admin -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U restore_admin -d postgres >/dev/null

STAGE=restore-sql
# pg_dumpall includes CREATE DATABASE postgres; that one already exists in a
# fresh cluster. Capture expected duplicate-object errors without leaking SQL.
gzip -dc "$WORK_DIR/postgres-all.sql.gz" \
  | docker exec -i "$CONTAINER" psql -X -U restore_admin -d postgres \
    > "$WORK_DIR/restore.log" 2>&1 || {
      echo "La importación SQL falló; errores: $(grep -c '^ERROR:' "$WORK_DIR/restore.log" || true)" >&2
      exit 1
    }

STAGE=verify-databases
EXPECTED_DATABASES='files_db inspection_db postgres project_management_db travel_planner_db user_management_db'
RESTORED_DATABASES=$(docker exec "$CONTAINER" psql -X -U restore_admin -d postgres -Atc \
  "SELECT string_agg(datname, ' ' ORDER BY datname) FROM pg_database WHERE datistemplate = false AND datname <> 'restore_admin'")
if [[ "$RESTORED_DATABASES" != "$EXPECTED_DATABASES" ]]; then
  echo "Bases esperadas: $EXPECTED_DATABASES" >&2
  echo "Bases restauradas: $RESTORED_DATABASES" >&2
  exit 1
fi

for database in files_db inspection_db project_management_db travel_planner_db user_management_db; do
  count=$(docker exec "$CONTAINER" psql -X -U restore_admin -d "$database" -Atc \
    "SELECT count(*) FROM pg_tables WHERE schemaname='public'")
  test "$count" -gt 0
  echo "Restaurada $database: $count tablas públicas"
done

docker exec "$CONTAINER" psql -X -U restore_admin -d files_db -Atc \
  'SELECT count(*), coalesce(sum(octet_length(data)), 0) FROM file_blobs' \
  | awk -F '|' '{ print "Fotos/archivos sincronizados: " $1 " objetos, " $2 " bytes" }'
SQL_ERRORS=$(grep -c '^ERROR:' "$WORK_DIR/restore.log" || true)
echo "Errores SQL en log de restauración: $SQL_ERRORS"
test "$SQL_ERRORS" -eq 0
echo "Prueba aislada completada: $OBJECT_NAME"
