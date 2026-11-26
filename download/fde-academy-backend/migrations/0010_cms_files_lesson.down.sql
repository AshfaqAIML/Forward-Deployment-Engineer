DROP INDEX IF EXISTS idx_files_lesson;
ALTER TABLE files DROP COLUMN IF EXISTS lesson_id;
