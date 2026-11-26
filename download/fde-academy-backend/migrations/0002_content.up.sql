-- 0002_content.up.sql — learning content: subjects, stages, courses, modules, chapters, lessons
CREATE TYPE content_status AS ENUM ('draft', 'in_review', 'published', 'archived');
CREATE TYPE difficulty_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');

CREATE TABLE subjects (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key      text NOT NULL UNIQUE,          -- 'mathematics', 'programming', ...
  name     text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

-- The 18-stage roadmap: the backbone of the curriculum.
CREATE TABLE learning_stages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_number integer NOT NULL UNIQUE CHECK (stage_number BETWEEN 1 AND 18),
  phase       text NOT NULL CHECK (phase IN ('A','B','C','D','E','F','G')),
  title       text NOT NULL,
  meta_text   text,
  UNIQUE (stage_number, phase)
);

CREATE TABLE courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,       -- 'fm', 'algebra', ...
  title       text NOT NULL,
  subject_id  uuid NOT NULL REFERENCES subjects (id),
  stage_id    uuid NOT NULL REFERENCES learning_stages (id),
  difficulty  difficulty_level NOT NULL,
  blurb       text,
  objectives  jsonb NOT NULL DEFAULT '[]',
  prereq_note text,
  sort_order  integer NOT NULL DEFAULT 0,
  status      content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_subject ON courses (subject_id);
CREATE INDEX idx_courses_stage ON courses (stage_id);
CREATE INDEX idx_courses_status ON courses (status);

-- Explicit course-level prerequisite edges (the roadmap implies more; these are
-- the machine-checkable ones used to gate enrolment-free progression hints).
CREATE TABLE course_prerequisites (
  course_id              uuid NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  prerequisite_course_id uuid NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, prerequisite_course_id),
  CHECK (course_id <> prerequisite_course_id)
);

CREATE TABLE modules (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  position  integer NOT NULL,
  title     text NOT NULL,
  UNIQUE (course_id, position)
);

CREATE TABLE chapters (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules (id) ON DELETE CASCADE,
  position  integer NOT NULL,
  title     text NOT NULL,
  UNIQUE (module_id, position)
);

-- Lessons carry their teaching content as structured JSON blocks (the same block
-- schema the frontend renders: paragraphs, tables, code, interactive components).
CREATE TABLE lessons (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,       -- 'fm-1', 'lo-3', ...
  course_id  uuid NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  chapter_id uuid NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  stage_id   uuid NOT NULL REFERENCES learning_stages (id),   -- denormalised for stage queries
  position   integer NOT NULL,
  title      text NOT NULL,
  minutes    integer NOT NULL CHECK (minutes BETWEEN 1 AND 600),
  objectives jsonb NOT NULL DEFAULT '[]',
  content    jsonb NOT NULL DEFAULT '[]',
  status     content_status NOT NULL DEFAULT 'draft',
  version    integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chapter_id, position)
);
CREATE INDEX idx_lessons_course ON lessons (course_id);
CREATE INDEX idx_lessons_stage ON lessons (stage_id);
CREATE INDEX idx_lessons_status ON lessons (status);

CREATE TABLE lesson_prerequisites (
  lesson_id              uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  prerequisite_lesson_id uuid NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, prerequisite_lesson_id),
  CHECK (lesson_id <> prerequisite_lesson_id)
);

-- Additional learning resources attached to lessons or books (links / videos).
-- Binary resources are files managed by the file/download tables (0003).
CREATE TYPE resource_kind AS ENUM ('link', 'video');
CREATE TABLE learning_resources (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons (id) ON DELETE CASCADE,
  book_id   uuid,                        -- FK added in 0003 after books exists
  title     text NOT NULL,
  kind      resource_kind NOT NULL DEFAULT 'link',
  url       text NOT NULL CHECK (url ~ '^https?://'),
  position  integer NOT NULL DEFAULT 0
);
CREATE INDEX idx_resources_lesson ON learning_resources (lesson_id);
