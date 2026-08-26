#!/usr/bin/env bash
set -Eeuo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_RESTORE_DATABASE_URL:?BACKUP_RESTORE_DATABASE_URL must point to a separate restore database}"

if [[ "${BACKUP_RESTORE_ALLOW:-false}" != "true" ]]; then
  echo "Backup rehearsal is guarded. Set BACKUP_RESTORE_ALLOW=true for an explicit non-production run." >&2
  exit 2
fi

command -v pg_dump >/dev/null || { echo "pg_dump is required" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "pg_restore is required" >&2; exit 1; }
command -v psql >/dev/null || { echo "psql is required" >&2; exit 1; }

work_dir="$(mktemp -d)"
backup_file="$work_dir/pathfinder.backup"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT

query_scalar() {
  local database_url="$1"
  local query="$2"
  psql "$database_url" --no-psqlrc -v ON_ERROR_STOP=1 -Atqc "$query" | tr -d '[:space:]'
}

restore_table_count="$(query_scalar "$BACKUP_RESTORE_DATABASE_URL" "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
if [[ "$restore_table_count" != "0" ]]; then
  echo "Restore database must be empty; refusing to overwrite existing tables." >&2
  exit 1
fi

pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-acl \
  --file="$backup_file"

pg_restore \
  --dbname="$BACKUP_RESTORE_DATABASE_URL" \
  --no-owner \
  --no-acl \
  "$backup_file"

source_table_count="$(query_scalar "$DATABASE_URL" "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
restored_table_count="$(query_scalar "$BACKUP_RESTORE_DATABASE_URL" "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public';")"
source_migration_count="$(query_scalar "$DATABASE_URL" "SELECT COUNT(*) FROM schema_migrations;")"
restored_migration_count="$(query_scalar "$BACKUP_RESTORE_DATABASE_URL" "SELECT COUNT(*) FROM schema_migrations;")"
source_resume_count="$(query_scalar "$DATABASE_URL" "SELECT COUNT(*) FROM resume_analyses;")"
restored_resume_count="$(query_scalar "$BACKUP_RESTORE_DATABASE_URL" "SELECT COUNT(*) FROM resume_analyses;")"

if [[ "$source_table_count" != "$restored_table_count" ]]; then
  echo "Backup rehearsal failed: public table counts differ." >&2
  exit 1
fi
if [[ "$source_migration_count" != "$restored_migration_count" ]]; then
  echo "Backup rehearsal failed: migration counts differ." >&2
  exit 1
fi
if [[ "$source_resume_count" != "$restored_resume_count" ]]; then
  echo "Backup rehearsal failed: resume analysis row counts differ." >&2
  exit 1
fi

printf 'Backup rehearsal passed: tables=%s migrations=%s resume_analyses=%s\n' \
  "$restored_table_count" "$restored_migration_count" "$restored_resume_count"
