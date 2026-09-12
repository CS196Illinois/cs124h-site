-- Run in Supabase SQL editor before deploying scoped events.
-- Safe to run more than once.
ALTER TABLE events ADD COLUMN IF NOT EXISTS audience_type text NOT NULL DEFAULT 'all';
ALTER TABLE events ADD COLUMN IF NOT EXISTS audience_values jsonb NOT NULL DEFAULT '[]'::jsonb;
UPDATE events SET audience_type = 'all', audience_values = '[]'::jsonb
WHERE audience_type IS NULL OR audience_values IS NULL;
