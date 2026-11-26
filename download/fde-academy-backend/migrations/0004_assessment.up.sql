-- 0004_assessment.up.sql — quizzes, questions, options, attempts, answers
CREATE TYPE quiz_kind AS ENUM ('lesson_check', 'topic_test', 'mock_exam');
CREATE TYPE attempt_status AS ENUM ('in_progress', 'submitted', 'abandoned');

-- Quizzes attach to a lesson (knowledge check), a course (topic test) or the
-- programme (mock exam). pass_pct is enforced server-side when scoring.
CREATE TABLE quizzes (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code               text NOT NULL UNIQUE,     -- 'quiz-fm-1', 'tt-fm', 'mock-a'
  kind               quiz_kind NOT NULL,
  lesson_id          uuid REFERENCES lessons (id) ON DELETE CASCADE,
  course_id          uuid REFERENCES courses (id) ON DELETE CASCADE,
  title              text NOT NULL,
  pass_pct           integer NOT NULL DEFAULT 70 CHECK (pass_pct BETWEEN 1 AND 100),
  time_limit_minutes integer CHECK (time_limit_minutes IS NULL OR time_limit_minutes BETWEEN 1 AND 240),
  status             content_status NOT NULL DEFAULT 'draft',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'lesson_check' AND lesson_id IS NOT NULL)
      OR (kind = 'topic_test'    AND course_id IS NOT NULL)
      OR  kind = 'mock_exam')
);
CREATE INDEX idx_quizzes_lesson ON quizzes (lesson_id);
CREATE INDEX idx_quizzes_course ON quizzes (course_id);
CREATE INDEX idx_quizzes_status ON quizzes (status);

CREATE TABLE questions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     uuid NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  position    integer NOT NULL,
  prompt      text NOT NULL,
  explanation text NOT NULL,               -- shown only AFTER the attempt is submitted
  UNIQUE (quiz_id, position)
);

-- Options: is_correct is server-only. The student-facing API NEVER serializes it;
-- scores are computed exclusively here, in the database's source of truth.
CREATE TABLE question_options (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  position   integer NOT NULL,
  text       text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  UNIQUE (question_id, position)
);

-- Integrity: every question must have exactly one correct option. The check is
-- a DEFERRED constraint trigger: it runs at COMMIT, so authors may insert the
-- options row-by-row; an inconsistent final state still fails the transaction.
-- Authoring mistakes are rejected at the database level.
CREATE OR REPLACE FUNCTION check_single_correct_option() RETURNS trigger AS $$
BEGIN
  IF (SELECT count(*) FROM question_options WHERE question_id = NEW.question_id AND is_correct) <> 1 THEN
    RAISE EXCEPTION 'question % must have exactly one correct option', NEW.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_question_options_single_correct
  AFTER INSERT OR UPDATE OF is_correct, question_id ON question_options
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_single_correct_option();

-- Attempts: score/passed are set ONLY by the submit endpoint's server-side
-- computation; clients cannot write them.
CREATE TABLE quiz_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id     uuid NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score       integer CHECK (score IS NULL OR score BETWEEN 0 AND 100),
  passed      boolean,
  status      attempt_status NOT NULL DEFAULT 'in_progress',
  CHECK (status <> 'submitted' OR (score IS NOT NULL AND passed IS NOT NULL AND submitted_at IS NOT NULL))
);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts (user_id);
CREATE INDEX idx_quiz_attempts_quiz ON quiz_attempts (quiz_id);

-- Chosen answers, upserted while the attempt is in progress.
CREATE TABLE attempt_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  uuid NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  option_id   uuid NOT NULL REFERENCES question_options (id),
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
CREATE INDEX idx_attempt_answers_attempt ON attempt_answers (attempt_id);
