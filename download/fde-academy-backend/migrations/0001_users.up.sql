-- 0001_users.up.sql — users, profiles, preferences, sessions, password recovery
-- Enums
CREATE TYPE user_role AS ENUM ('student', 'author', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'suspended');

-- Users: account + role. Passwords stored ONLY as scrypt hashes
-- (format: scrypt$N$r$p$saltB64$hashB64 — never plain text, never reversible).
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE CHECK (email = lower(email) AND position('@' in email) > 1),
  password_hash text NOT NULL,
  display_name  text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 60),
  role          user_role NOT NULL DEFAULT 'student',
  status        user_status NOT NULL DEFAULT 'active',
  email_verified boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_status ON users (status);

-- Private profile data: served only to the owning user (and never in public/admin lists).
CREATE TABLE user_profiles (
  user_id   uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  full_name text,
  country   text,
  timezone  text NOT NULL DEFAULT 'UTC',
  bio       text CHECK (bio IS NULL OR char_length(bio) <= 500),
  career_goal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Learning preferences (mirrors the frontend preference panel).
CREATE TABLE learning_preferences (
  user_id               uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  weekly_goal_sessions  integer NOT NULL DEFAULT 3 CHECK (weekly_goal_sessions BETWEEN 1 AND 7),
  preferred_subjects    text[] NOT NULL DEFAULT '{}',
  large_text            boolean NOT NULL DEFAULT false,
  reduced_motion        boolean NOT NULL DEFAULT false,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Refresh tokens: opaque random tokens, stored hashed (sha256), rotated on use,
-- revocable on logout / password change. Access tokens are short-lived JWTs and
-- are stateless, so compromise windows are minutes, not days.
CREATE TABLE refresh_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  user_agent text,
  ip_hash    text,                -- hashed client IP for abuse detection; raw IPs are never stored
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);

-- Password recovery: single-use, time-limited tokens; only sha256 hashes stored.
CREATE TABLE password_reset_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);
