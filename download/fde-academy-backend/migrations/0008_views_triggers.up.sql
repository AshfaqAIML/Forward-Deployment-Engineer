-- 0008_views_triggers.up.sql — updated_at maintenance, search support, analytics views
-- Generic updated_at maintenance for mutable tables.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_profiles','learning_preferences','courses','lessons','books',
    'quizzes','coding_exercises','math_exercises','projects','notes',
    'study_progress','glossary_terms','content_drafts','exercise_solutions'
  ] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I
                    FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END;
$$;

-- Search support: trigram indexes over the text users search for. (pg_trgm is
-- optional in some hosted environments; the search queries fall back to ILIKE
-- when the extension is unavailable.)
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  CREATE INDEX idx_lessons_title_trgm ON lessons USING gin (title gin_trgm_ops);
  CREATE INDEX idx_courses_title_trgm ON courses USING gin (title gin_trgm_ops);
  CREATE INDEX idx_books_title_trgm    ON books USING gin (title gin_trgm_ops);
  CREATE INDEX idx_glossary_term_trgm  ON glossary_terms USING gin (term gin_trgm_ops);
  CREATE INDEX idx_projects_title_trgm ON projects USING gin (title gin_trgm_ops);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_trgm unavailable (%); search falls back to ILIKE', SQLERRM;
END;
$$;

-- Content health view: assessments averaging below 70% across attempts.
CREATE VIEW v_content_health AS
SELECT q.id AS quiz_id, q.code AS quiz_code, q.title,
       count(a.id) AS attempts,
       coalesce(round(avg(a.score)), 0)::int AS avg_score,
       coalesce(round(100.0 * count(*) FILTER (WHERE a.passed) / nullif(count(a.id), 0)), 0)::int AS pass_rate
FROM quizzes q
LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.status = 'submitted'
WHERE q.status = 'published'
GROUP BY q.id, q.code, q.title;

-- Book progress view: per user per book — chapters read from progress rows,
-- total from the book's full chapter list.
CREATE VIEW v_book_progress AS
SELECT r.user_id, b.id AS book_id, b.slug,
       count(*) FILTER (WHERE r.read) AS chapters_read,
       (SELECT count(*) FROM book_chapters c2 WHERE c2.book_id = b.id) AS chapters_total,
       (round(100.0 * count(*) FILTER (WHERE r.read)
             / nullif((SELECT count(*) FROM book_chapters c2 WHERE c2.book_id = b.id), 0)))::int AS pct
FROM book_reading_progress r
JOIN book_chapters c ON c.id = r.chapter_id
JOIN books b ON b.id = c.book_id
GROUP BY r.user_id, b.id, b.slug;

-- Download management view: audit-friendly listing without exposing storage keys.
CREATE VIEW v_download_log AS
SELECT d.id, d.at, f.original_filename, f.kind AS file_kind, f.bytes,
       u.display_name AS user_display_name
FROM download_records d
JOIN files f ON f.id = d.file_id
LEFT JOIN users u ON u.id = d.user_id;
