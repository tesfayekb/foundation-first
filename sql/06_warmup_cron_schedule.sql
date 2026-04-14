-- =============================================================================
-- Warmup Cron Schedules — Edge Function Cold-Start Prevention
--
-- PREREQUISITES:
--   1. pg_cron and pg_net extensions enabled
--   2. All edge functions deployed
--
-- MANUAL STEP: Before running, replace the two placeholders:
--   - PROJECT_REF → your Supabase project ref (e.g. abcdefghijklmnop)
--   - YOUR_ANON_KEY → your Supabase anon/publishable key
--
-- This file is in sql/ (not supabase/migrations/) because it contains
-- environment-specific values that must not be committed to version control.
-- Apply via the Supabase SQL Editor after deployment.
-- =============================================================================

-- 1. list-users warm-up — every 4 minutes
SELECT cron.schedule(
  'warmup-list-users',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/list-users',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  ) AS request_id;
  $$
);

-- 2. list-roles warm-up — every 4 minutes
SELECT cron.schedule(
  'warmup-list-roles',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/list-roles',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  ) AS request_id;
  $$
);

-- 3. list-permissions warm-up — every 4 minutes
SELECT cron.schedule(
  'warmup-list-permissions',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/list-permissions',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  ) AS request_id;
  $$
);

-- 4. query-audit-logs warm-up — every 4 minutes
SELECT cron.schedule(
  'warmup-query-audit-logs',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/query-audit-logs',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  ) AS request_id;
  $$
);

-- 5. get-user-stats warm-up — every 4 minutes
SELECT cron.schedule(
  'warmup-get-user-stats',
  '*/4 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/get-user-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"warmup": true}'::jsonb
  ) AS request_id;
  $$
);
