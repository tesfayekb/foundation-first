-- =============================================================================
-- MFA Recovery Code Cleanup Cron
--
-- PREREQUISITES:
--   1. pg_cron extension enabled
--   2. cleanup_mfa_recovery_codes() function exists (created by migrations)
--
-- No secrets needed — calls a DB function directly.
-- =============================================================================

SELECT cron.schedule(
  'cleanup-mfa-recovery-codes',
  '0 4 * * 0',
  $$SELECT public.cleanup_mfa_recovery_codes();$$
);
