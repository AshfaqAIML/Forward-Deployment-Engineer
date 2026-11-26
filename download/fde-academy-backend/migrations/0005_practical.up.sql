-- 0005_practical.up.sql — exercises, hints, solutions, projects, submissions, evaluation
CREATE TYPE exercise_owner AS ENUM ('coding_exercise', 'math_exercise', 'project');
CREATE TYPE submission_status AS ENUM ('submitted', 'reviewed');

-- Coding exercises: the sandbox labs (JavaScript/SQL/HTTP variants).
-- starter_code is public; hints and solutions live in their own tables and are
-- gated by the API (attempt-first policy).
CREATE TABLE coding_exercises (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,           -- 'code-c1', 'sql-1', 'api-1'
  title       text NOT NULL,
  language    text NOT NULL CHECK (language IN ('JavaScript', 'SQL', 'HTTP', 'Python-guided')),
  instructions text NOT NULL,
  starter_code text NOT NULL,
  minutes     integer NOT NULL DEFAULT 20 CHECK (minutes BETWEEN 5 AND 120),
  linked_lesson_id uuid REFERENCES lessons (id) ON DELETE SET NULL,
  status      content_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Mathematical exercises: interactive component configs (fraction/percent/
-- geometry/number-line drills) in the same block schema the frontend renders.
CREATE TABLE math_exercises (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  title       text NOT NULL,
  prompt      text NOT NULL,
  config      jsonb NOT NULL DEFAULT '{}',
  minutes     integer NOT NULL DEFAULT 15 CHECK (minutes BETWEEN 5 AND 120),
  linked_lesson_id uuid REFERENCES lessons (id) ON DELETE SET NULL,
  status      content_status NOT NULL DEFAULT 'draft',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Hints, position-ordered; unlock policy enforced by the API (a real attempt
-- must exist before hints are served).
CREATE TABLE exercise_hints (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type exercise_owner NOT NULL,
  owner_id   uuid NOT NULL,
  position   integer NOT NULL,
  content    text NOT NULL,
  UNIQUE (owner_type, owner_id, position)
);

-- Solutions: never sent before the client has attempted AND seen hints.
CREATE TABLE exercise_solutions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type exercise_owner NOT NULL,
  owner_id   uuid NOT NULL,
  content    text NOT NULL,
  status     content_status NOT NULL DEFAULT 'published',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_type, owner_id)
);

-- Projects: Levels 1–7 portfolio builds (steps + demonstration checklist as
-- structured JSON; rubric dimensions documented in the API).
CREATE TABLE projects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,        -- 'p1-1' ... 'p7-3'
  level         integer NOT NULL CHECK (level BETWEEN 1 AND 7),
  stage_id      uuid REFERENCES learning_stages (id),
  title         text NOT NULL,
  customer      text NOT NULL,
  brief         text NOT NULL,
  steps         jsonb NOT NULL DEFAULT '[]',
  demo_checklist jsonb NOT NULL DEFAULT '[]',
  concepts      text[] NOT NULL DEFAULT '{}',
  status        content_status NOT NULL DEFAULT 'draft',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_stage ON projects (stage_id);
CREATE INDEX idx_projects_level ON projects (level);

-- Project submissions: one per user per project; evidence and checklist are
-- validated server-side (all checklist items must be true, evidence >= 20 chars).
CREATE TABLE project_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  evidence     text NOT NULL CHECK (char_length(evidence) >= 20),
  checklist    jsonb NOT NULL DEFAULT '[]',
  status       submission_status NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
CREATE INDEX idx_project_submissions_user ON project_submissions (user_id);

-- Rubric evaluations: six dimensions (Understanding, Correctness, Craft, Safety,
-- Operation, Communication) scored 0–4; pass at 16/24 with none below 2.
CREATE TABLE evaluation_results (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL UNIQUE REFERENCES project_submissions (id) ON DELETE CASCADE,
  rubric       jsonb NOT NULL,
  total        integer NOT NULL CHECK (total BETWEEN 0 AND 24),
  passed       boolean NOT NULL,
  feedback     text,
  evaluated_by uuid REFERENCES users (id),
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

-- Lab submissions: sandbox code the student chose to record (timestamps honest).
CREATE TABLE lab_submissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES coding_exercises (id) ON DELETE SET NULL,
  code        text NOT NULL CHECK (char_length(code) BETWEEN 1 AND 20000),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lab_submissions_user ON lab_submissions (user_id);
