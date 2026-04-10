-- Allow service-role inserts to audit_logs (append-only)
-- Edge functions use supabaseAdmin (service role) which bypasses RLS,
-- but we add an explicit INSERT policy for defense-in-depth:
-- only authenticated users (via edge functions) can insert, never update/delete.

-- INSERT policy: service role and authenticated edge functions can append
CREATE POLICY "audit_logs_insert_policy"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Explicitly ensure NO update or delete policies exist (append-only enforcement)
-- (No policies to create — absence of UPDATE/DELETE policies = denied by default with RLS enabled)