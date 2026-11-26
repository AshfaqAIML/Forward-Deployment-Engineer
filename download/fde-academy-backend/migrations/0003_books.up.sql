-- 0003_books.up.sql — book library, editions, chapters, files, versions, download pipeline, reading progress
CREATE TYPE book_format AS ENUM ('docx', 'doc', 'pdf', 'web');
CREATE TYPE file_kind AS ENUM ('book', 'edition', 'chapter', 'resource');

CREATE TABLE books (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,      -- 'fm', 'alg', ...
  title       text NOT NULL,
  subject     text NOT NULL,
  difficulty  text NOT NULL,
  description text,
  objectives  jsonb NOT NULL DEFAULT '[]',
  stage_id    uuid REFERENCES learning_stages (id),
  pages       integer CHECK (pages IS NULL OR pages > 0),
  status      content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_books_status ON books (status);

-- FK for learning_resources.book_id, added now that books exists.
ALTER TABLE learning_resources
  ADD CONSTRAINT fk_resources_book FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE;

CREATE TABLE book_editions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      uuid NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  version      text NOT NULL,            -- '1.0'
  format       book_format NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  notes        text,
  UNIQUE (book_id, version, format)
);

CREATE TABLE book_chapters (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id  uuid NOT NULL REFERENCES books (id) ON DELETE CASCADE,
  position integer NOT NULL,
  title    text NOT NULL,
  content  jsonb NOT NULL DEFAULT '[]',  -- same block schema as lessons
  full_web boolean NOT NULL DEFAULT true,-- full interactive web edition vs print-edition overview
  UNIQUE (book_id, position)
);

-- Files live in PRIVATE storage; storage_key is internal and NEVER exposed by the API.
-- Downloads happen exclusively through signed, single-use, expiring tokens (0003).
CREATE TABLE files (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id           uuid REFERENCES books (id) ON DELETE CASCADE,
  edition_id        uuid REFERENCES book_editions (id) ON DELETE CASCADE,
  chapter_id        uuid REFERENCES book_chapters (id) ON DELETE CASCADE,
  kind              file_kind NOT NULL DEFAULT 'book',
  storage_key       text NOT NULL UNIQUE,          -- internal path, e.g. books/fm_v1.doc
  original_filename text NOT NULL,                 -- safe public name for Content-Disposition
  mime_type         text NOT NULL,
  bytes             bigint NOT NULL CHECK (bytes >= 0),
  checksum_sha256   text NOT NULL CHECK (char_length(checksum_sha256) = 64),
  uploaded_by       uuid REFERENCES users (id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (kind <> 'book' OR book_id IS NOT NULL),
  CHECK (kind <> 'edition' OR edition_id IS NOT NULL),
  CHECK (kind <> 'chapter' OR chapter_id IS NOT NULL)
);
CREATE INDEX idx_files_book ON files (book_id);
CREATE INDEX idx_files_edition ON files (edition_id);

-- Versioned copies of files: old editions remain auditable and downloadable.
CREATE TABLE file_versions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id        uuid NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  version        integer NOT NULL,
  storage_key    text NOT NULL,
  bytes          bigint NOT NULL,
  checksum_sha256 text NOT NULL,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (file_id, version)
);

-- Single-use, expiring download tokens: raw token goes to the client, only its
-- sha256 hash is stored. Download URLs are /api/v1/downloads/<token>, never a
-- storage path.
CREATE TABLE download_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id     uuid NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  requested_by uuid REFERENCES users (id),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_download_tokens_file ON download_tokens (file_id);

-- Download audit log. Privacy: user id + timestamp only; no IPs, no emails.
CREATE TABLE download_records (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES files (id) ON DELETE CASCADE,
  user_id uuid REFERENCES users (id),
  at      timestamptz NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR true)   -- anonymous downloads are not issued by this API
);
CREATE INDEX idx_download_records_file ON download_records (file_id);
CREATE INDEX idx_download_records_at ON download_records (at);

-- Per-chapter reading progress (the book progress bar is derived from this).
CREATE TABLE book_reading_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  chapter_id   uuid NOT NULL REFERENCES book_chapters (id) ON DELETE CASCADE,
  read         boolean NOT NULL DEFAULT true,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);
CREATE INDEX idx_reading_progress_user ON book_reading_progress (user_id);
