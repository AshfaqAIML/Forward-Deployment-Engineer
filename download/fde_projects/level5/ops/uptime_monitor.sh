#!/usr/bin/env bash
# Project 5.2 - Uptime monitor: one check per run (put it in cron every minute).
#   ./uptime_monitor.sh http://localhost:8000
# Writes a line to uptime.log, keeps the log under a size cap, and exits
# non-zero when the health check fails (so cron can email you).
URL="${1:-http://localhost:8000/api/health}"
LOG="${LOG:-uptime.log}"
MAX_LINES=10000

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" || echo 000)
NOW=$(date '+%Y-%m-%d %H:%M:%S')
if [ "$HTTP_CODE" = "200" ]; then
  STATUS=UP
else
  STATUS=DOWN
fi
echo "$NOW $STATUS ($HTTP_CODE) $URL" >> "$LOG"

# Keep the log bounded: keep only the newest MAX_LINES lines.
if [ "$(wc -l < "$LOG")" -gt "$MAX_LINES" ]; then
  tail -n "$MAX_LINES" "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi

# Count DOWN lines in the last 20 checks; alert through the exit code.
RECENT=$(tail -n 20 "$LOG" | grep -c DOWN)
if [ "$RECENT" -ge 3 ]; then
  echo "ALERT: $RECENT of the last 20 checks were DOWN for $URL" >&2
  exit 1
fi
exit 0
