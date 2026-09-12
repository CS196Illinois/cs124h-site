-- Run in Supabase SQL editor before deploying scoped events.
-- Safe to run more than once.

-- Production events
ALTER TABLE events ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'all';
ALTER TABLE events ADD COLUMN IF NOT EXISTS audience_values jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE events SET audience_type = 'all', audience_values = '[]'::jsonb
WHERE audience_type IS NULL OR audience_values IS NULL;

-- Test events (for automated test suite)
ALTER TABLE test_events ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'all';
ALTER TABLE test_events ADD COLUMN IF NOT EXISTS audience_values jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE test_events SET audience_type = 'all', audience_values = '[]'::jsonb
WHERE audience_type IS NULL OR audience_values IS NULL;
