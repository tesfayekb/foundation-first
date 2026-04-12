CREATE INDEX IF NOT EXISTS idx_job_executions_state_created
ON public.job_executions (state, created_at DESC);