DROP VIEW IF EXISTS v_course_mastery;
DROP VIEW IF EXISTS v_subject_mastery;
ALTER TABLE files DROP CONSTRAINT IF EXISTS chk_files_visibility;
ALTER TABLE files DROP COLUMN IF EXISTS visibility;
DROP TYPE IF EXISTS file_visibility;
DROP TABLE IF EXISTS option_feedback;
DROP TABLE IF EXISTS question_feedback;
