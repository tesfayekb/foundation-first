-- Add correlation_id as a top-level indexed column
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS correlation_id text;

-- Backfill from metadata JSONB
UPDATE public.audit_logs
  SET correlation_id = metadata->>'correlation_id'
  WHERE metadata ? 'correlation_id'
    AND correlation_id IS NULL;

-- Create index for fast trace lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id
  ON public.audit_logs(correlation_id)
  WHERE correlation_id IS NOT NULL;