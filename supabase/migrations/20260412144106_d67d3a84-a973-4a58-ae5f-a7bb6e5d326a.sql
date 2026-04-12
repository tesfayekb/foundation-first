-- MIG-038: Composite index for audit logs by target + time, and MFA recovery code cleanup function

-- Composite index for UserDetailPage audit query:
-- SELECT * FROM audit_logs WHERE target_id = ? ORDER BY created_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_created
  ON public.audit_logs (target_id, created_at DESC);

-- MFA recovery code cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_mfa_recovery_codes()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  -- Delete used codes older than 90 days
  DELETE FROM public.mfa_recovery_codes
  WHERE used_at IS NOT NULL
    AND used_at < now() - interval '90 days';

  -- Delete old unused codes per user, keep only latest 10 per user
  DELETE FROM public.mfa_recovery_codes
  WHERE id IN (
    SELECT mc.id
    FROM public.mfa_recovery_codes mc
    WHERE mc.used_at IS NULL
      AND mc.id NOT IN (
        SELECT sub.id
        FROM public.mfa_recovery_codes sub
        WHERE sub.user_id = mc.user_id
          AND sub.used_at IS NULL
        ORDER BY sub.created_at DESC
        LIMIT 10
      )
  );
END;
$$;