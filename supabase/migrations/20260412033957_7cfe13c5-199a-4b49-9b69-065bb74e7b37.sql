-- Fix 2: Update permissions RLS to check permissions.view instead of roles.view
DROP POLICY IF EXISTS "permissions_select_policy" ON public.permissions;
CREATE POLICY "permissions_select_policy"
  ON public.permissions FOR SELECT TO authenticated
  USING (public.has_permission(auth.uid(), 'permissions.view'));

-- Fix 3: Add missing index on audit_logs.target_id
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON public.audit_logs(target_id);