-- 0007_admin.up.sql — content authors, drafts, reviews, revisions, publish events
CREATE TYPE draft_entity AS ENUM ('course', 'lesson', 'book', 'book_chapter', 'quiz',
                                  'coding_exercise', 'math_exercise', 'project', 'glossary_term');
CREATE TYPE draft_status AS ENUM ('draft', 'in_review', 'approved', 'rejected', 'published');
CREATE TYPE review_verdict AS ENUM ('approved', 'rejected');
CREATE TYPE publish_action AS ENUM ('publish', 'unpublish', 'archive');

-- Author records (users with the 'author' role get one of these).
CREATE TABLE content_authors (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  bio       text,
  expertise text[] NOT NULL DEFAULT '{}',
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- Drafts: proposed changes as JSON payloads against an entity (new or existing).
-- Students never see drafts; publishing is the admin's explicit action.
CREATE TABLE content_drafts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type draft_entity NOT NULL,
  entity_id  uuid,
  payload    jsonb NOT NULL,
  author_id  uuid NOT NULL REFERENCES users (id),
  status     draft_status NOT NULL DEFAULT 'draft',
  change_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_content_drafts_entity ON content_drafts (entity_type, entity_id);
CREATE INDEX idx_content_drafts_status ON content_drafts (status);

-- Reviews: admin verdicts with comments, one row per review action.
CREATE TABLE content_reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id   uuid NOT NULL REFERENCES content_drafts (id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES users (id),
  verdict    review_verdict NOT NULL,
  comments   text,
  at         timestamptz NOT NULL DEFAULT now()
);

-- Revision history: full snapshots on every published change (rollback-capable).
CREATE TABLE content_revisions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  version     integer NOT NULL,
  snapshot    jsonb NOT NULL,
  changed_by  uuid REFERENCES users (id),
  change_note text,
  at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, version)
);

-- Publish events: the audit trail of what went live, when, and by whom.
CREATE TABLE publish_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id   uuid NOT NULL,
  action      publish_action NOT NULL,
  actor_id    uuid REFERENCES users (id),
  version     integer,
  at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_publish_events_entity ON publish_events (entity_type, entity_id);
