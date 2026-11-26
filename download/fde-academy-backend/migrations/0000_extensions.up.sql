-- 0000_extensions.up.sql — FDE Academy backend
-- gen_random_uuid() is core in PostgreSQL 13+. pgcrypto is loaded for older
-- servers; environments without extension support (e.g. the PGlite test engine)
-- skip it safely since they provide gen_random_uuid() in core.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgcrypto not available (%); relying on core gen_random_uuid()', SQLERRM;
END;
$$;
