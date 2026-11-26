// src/activity.js — the append-only student activity trail. Every meaningful
// action writes one event; dashboard statistics and streaks are computed FROM
// these rows (never from client-claimed values).
export async function logEvent(db, userId, kind, subjectType = null, subjectId = null, meta = {}) {
  await db.query(
    `INSERT INTO activity_events (user_id, kind, subject_type, subject_id, meta) VALUES ($1, $2, $3, $4, $5)`,
    [userId, kind, subjectType, subjectId, JSON.stringify(meta)]);
}

// Distinct active days over the last N days — the streak source of truth.
export async function activeDayCount(db, userId, days = 7) {
  const r = await db.query(
    `SELECT count(DISTINCT (at AT TIME ZONE 'UTC')::date) AS n
     FROM activity_events
     WHERE user_id = $1 AND at >= now() - ($2 || ' days')::interval`, [userId, days]);
  return r.rows[0].n;
}
