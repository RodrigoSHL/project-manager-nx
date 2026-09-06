#!/bin/bash
set -e

# Creates additional databases defined by *_DATABASE_NAME env vars.
# The main database (POSTGRES_DB) is already created by the official image.
# This script runs once on first container initialization.

create_db_if_missing() {
  local db="$1"
  echo "Creating database '$db' if it does not exist..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "${db}"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${db}')
    \gexec
    GRANT ALL PRIVILEGES ON DATABASE "${db}" TO "${POSTGRES_USER}";
EOSQL
  echo "Database '$db' ready."
}

# Add each extra database here via its env variable
if [ -n "$USER_DATABASE_NAME" ] && [ "$USER_DATABASE_NAME" != "$POSTGRES_DB" ]; then
  create_db_if_missing "$USER_DATABASE_NAME"
fi

if [ -n "$TRAVEL_DB_NAME" ] && [ "$TRAVEL_DB_NAME" != "$POSTGRES_DB" ]; then
  create_db_if_missing "$TRAVEL_DB_NAME"
fi

if [ -n "$FILES_DB_NAME" ] && [ "$FILES_DB_NAME" != "$POSTGRES_DB" ]; then
  create_db_if_missing "$FILES_DB_NAME"
fi

if [ -n "$INSPECTION_DB_NAME" ] && [ "$INSPECTION_DB_NAME" != "$POSTGRES_DB" ]; then
  create_db_if_missing "$INSPECTION_DB_NAME"
fi
