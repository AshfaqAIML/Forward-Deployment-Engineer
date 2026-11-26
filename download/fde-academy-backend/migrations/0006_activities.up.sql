-- 0006_activities.up.sql — completions, bookmarks, notes, history, progress, achievements
-- Lesson completion is granted ONLY through a passing quiz attempt (enforced by
-- the completion endpoint); the linkage is recorded here for audit.
CREATE TABLE lesson_completions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id        uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  quiz_attempt_id  uuid REFERENCES quiz_attempts (id) ON DELETE SET NULL,
  completed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX idx_lesson_completions_lesson ON lesson_completions (lesson_id);

CREATE TABLE bookmarks (
  user_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, lesson_id)
);

-- One editable note per user per lesson (matches the frontend notes panel).
CREATE TABLE notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id  uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  body       text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Append-only learning history / audit trail of student activity. This is what
-- the dashboard's real statistics are computed from — never client-claimed data.
CREATE TABLE activity_events (
  id           bigserial PRIMARY KEY,
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kind         text NOT NULL,              -- login, lesson_view, lesson_complete, quiz_submit,
                                           -- book_read, download, note_save, lab_run, ...
  subject_type text,
  subject_id   uuid,
  meta         jsonb NOT NULL DEFAULT '{}',
  at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_events_user_at ON activity_events (user_id, at DESC);
CREATE INDEX idx_activity_events_kind_at ON activity_events (kind, at DESC);

-- Per-course rollup maintained inside the completion transaction, so the
-- dashboard never computes progress from client input.
CREATE TABLE study_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id    uuid NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lessons_done integer NOT NULL DEFAULT 0 CHECK (lessons_done >= 0),
  pct          integer NOT NULL DEFAULT 0 CHECK (pct BETWEEN 0 AND 100),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
CREATE INDEX idx_study_progress_user ON study_progress (user_id);

-- Achievements: earned server-side from verified activity only.
CREATE TABLE achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  title       text NOT NULL,
  description text NOT NULL,
  icon        text NOT NULL DEFAULT 'star'
);

CREATE TABLE user_achievements (
  user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements (id) ON DELETE CASCADE,
  earned_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Glossary: searchable dictionary terms (admin-managed; changes tracked).
CREATE TABLE glossary_terms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text NOT NULL UNIQUE,
  term            text NOT NULL,
  simple_meaning  text NOT NULL,
  detailed_meaning text NOT NULL,
  example         text NOT NULL,
  related         text[] NOT NULL DEFAULT '{}',
  category        text NOT NULL DEFAULT 'General',
  is_admin_added  boolean NOT NULL DEFAULT false,
  status          content_status NOT NULL DEFAULT 'published',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
