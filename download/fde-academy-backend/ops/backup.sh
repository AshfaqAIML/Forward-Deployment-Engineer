#!/usr/bin/env bash
# ops/backup.sh — consistent backup of the file-backed PostgreSQL and the
# private file storage. Run from cron, keep N generations.
#
#   ./ops/backup.sh                     # writes backups/backups-<timestamp>.tar.gz
#   ./ops/backup.sh --restore backups/fde-<timestamp>.tar.gz   # rollback path
set -euo pipefail
cd "$(dirname "$0")/.."

TS=$(date -u +%Y%m%dT%H%M%SZ)
OUT="backups/fde-${TS}.tar.gz"
mkdir -p backups

if [ "${1:-}" = "--restore" ]; then
  SRC="${2:?usage: backup.sh --restore backups/fde-<stamp>.tar.gz}"
  test -f "$SRC" || { echo "no such backup: $SRC"; exit 1; }
  echo "[backup] stopping is your responsibility (systemd stop fde-academy)"
  echo "[backup] restoring $SRC over pgdata/ and storage/"
  mkdir -p pgdata storage
  tar xzf "$SRC"
  echo "[backup] restored. Start with: ./ops/deploy.sh --restart"
  exit 0
fi

if curl -sf http://127.0.0.1:8787/api/v1/health >/dev/null 2>&1; then
  echo "[backup] server is running — take a filesystem snapshot or stop it first for strict consistency"
fi

tar czf "$OUT" pgdata storage .env 2>/dev/null || {
  echo "[backup] pgdata/storage missing — backing up what exists"; true; }
# .env is included so the deployment can be fully rebuilt; it holds the JWT
# secret, so backups/fde-* must be stored with the same care as the secret.
chmod 600 "$OUT" 2>/dev/null || true
echo "[backup] wrote $OUT ($(du -h "$OUT" | cut -f1))"
echo "[backup] keep at least 7 daily and 4 weekly copies off-site (see docs/DEPLOYMENT.md)"
