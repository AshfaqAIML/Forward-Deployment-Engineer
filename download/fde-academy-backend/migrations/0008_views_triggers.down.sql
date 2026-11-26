DROP VIEW IF EXISTS v_download_log;
DROP VIEW IF EXISTS v_book_progress;
DROP VIEW IF EXISTS v_content_health;
DROP INDEX IF EXISTS idx_projects_title_trgm;
DROP INDEX IF EXISTS idx_glossary_term_trgm;
DROP INDEX IF EXISTS idx_books_title_trgm;
DROP INDEX IF EXISTS idx_courses_title_trgm;
DROP INDEX IF EXISTS idx_lessons_title_trgm;
DROP EXTENSION IF EXISTS pg_trgm;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','user_profiles','learning_preferences','courses','lessons','books',
    'quizzes','coding_exercises','math_exercises','projects','notes',
    'study_progress','glossary_terms','content_drafts','exercise_solutions'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
  END LOOP;
END;
$$;
DROP FUNCTION IF EXISTS set_updated_at();
