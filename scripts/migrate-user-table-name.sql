-- Rename the roster table without dropping or recreating any data.
-- Run this in the Supabase SQL editor before deploying code that uses `users`.
-- It is intentionally fail-safe: if both names exist, it stops instead of
-- guessing which table should win.

DO $$
BEGIN
  IF to_regclass('public."user-testing"') IS NOT NULL THEN
    IF to_regclass('public.users') IS NOT NULL THEN
      RAISE EXCEPTION 'Both "user-testing" and users exist; reconcile them before retrying';
    END IF;
    ALTER TABLE "user-testing" RENAME TO users;
  END IF;

  IF to_regclass('public."test_user-testing"') IS NOT NULL THEN
    IF to_regclass('public.test_users') IS NOT NULL THEN
      RAISE EXCEPTION 'Both "test_user-testing" and test_users exist; reconcile them before retrying';
    END IF;
    ALTER TABLE "test_user-testing" RENAME TO test_users;
  END IF;
END $$;

-- Keep the constraint name aligned with the new table name when the old
-- constraint came from the original schema. The check itself is unchanged.
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'users' AND c.conname = 'user_testing_sandbox_mode_check'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'users' AND c.conname = 'users_sandbox_mode_check'
     ) THEN
    ALTER TABLE users RENAME CONSTRAINT user_testing_sandbox_mode_check TO users_sandbox_mode_check;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.test_users') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'test_users' AND c.conname = 'test_user_testing_sandbox_mode_check'
     )
     AND NOT EXISTS (
       SELECT 1 FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'test_users' AND c.conname = 'test_users_sandbox_mode_check'
     ) THEN
    ALTER TABLE test_users RENAME CONSTRAINT test_user_testing_sandbox_mode_check TO test_users_sandbox_mode_check;
  END IF;
END $$;

-- Confirm both rows and schema objects are still present after the rename.
SELECT count(*) AS users_row_count FROM users;
