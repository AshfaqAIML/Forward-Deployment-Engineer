-- 0009_learning_engine.up.sql — knowledge-check feedback, public content
-- assets (diagrams), struggle/mastery analytics for the adaptive engine.

-- Per-question tutoring data: the simpler example shown after a wrong answer
-- and the challenge introduced after a correct one. Authored via the CMS;
-- when absent the feedback engine composes grounded fallbacks from the
-- lesson's own content.
CREATE TABLE question_feedback (
  question_id        uuid PRIMARY KEY REFERENCES questions (id) ON DELETE CASCADE,
  simpler_example    text NOT NULL,
  next_challenge     text NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Optional per-option misconception notes ("why YOUR answer is wrong"),
-- overriding the composed explanation for that option.
CREATE TABLE option_feedback (
  option_id          uuid PRIMARY KEY REFERENCES question_options (id) ON DELETE CASCADE,
  misconception_note text NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Content assets: diagrams and other public media referenced by lesson
-- blocks; books stay private. `files` gains a visibility flag so the same
-- table (checksums, versions, storage isolation) serves both.
DO $$
BEGIN
  CREATE TYPE file_visibility AS ENUM ('private', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;
ALTER TABLE files ADD COLUMN visibility file_visibility NOT NULL DEFAULT 'private';
ALTER TABLE files DROP CONSTRAINT IF EXISTS chk_files_visibility;
ALTER TABLE files ADD CONSTRAINT chk_files_visibility
  CHECK (visibility = 'private' OR kind IN ('chapter', 'resource', 'book', 'edition'));

-- Struggle detection source: per user per subject, from graded attempts.
CREATE VIEW v_subject_mastery AS
SELECT a.user_id,
       sub.key  AS subject_key,
       sub.name AS subject_name,
       count(a.id)                                   AS attempts,
       coalesce(round(avg(a.score)), 0)::int          AS avg_score,
       coalesce(round(100.0 * count(*) FILTER (WHERE a.passed)
             / nullif(count(*), 0)), 0)::int          AS pass_rate,
       max(a.submitted_at)                            AS last_attempt_at
FROM quiz_attempts a
JOIN quizzes q    ON q.id = a.quiz_id
JOIN lessons l    ON l.id = q.lesson_id
JOIN courses c    ON c.id = l.course_id
JOIN subjects sub ON sub.id = c.subject_id
WHERE a.status = 'submitted'
GROUP BY a.user_id, sub.key, sub.name;

-- Topic-level (course) mastery — finer grained for review recommendations.
CREATE VIEW v_course_mastery AS
SELECT a.user_id,
       c.id AS course_id, c.code AS course_code, c.title AS course_title,
       count(a.id)                                   AS attempts,
       coalesce(round(avg(a.score)), 0)::int          AS avg_score
FROM quiz_attempts a
JOIN quizzes q ON q.id = a.quiz_id
JOIN lessons l ON l.id = q.lesson_id
JOIN courses c ON c.id = l.course_id
WHERE a.status = 'submitted'
GROUP BY a.user_id, c.id, c.code, c.title;
