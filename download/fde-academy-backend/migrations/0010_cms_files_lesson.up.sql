-- 0010_cms_files_lesson.up.sql — CMS uploads: link public assets (diagrams)
-- to the lesson that embeds them.
ALTER TABLE files ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES lessons (id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_files_lesson ON files (lesson_id);
