import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthorizationContext } from '@/lib/rbac';

interface UseUserRolesResult {
  roles: string[];
  permissions: string[];
  isSuperadmin: boolean;
  loading: boolean;
  context: AuthorizationContext | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches the current user's effective authorization context via
 * get_my_authorization_context() RPC. Fail-secure: empty arrays on error.
 *
 * UX-only — does NOT enforce access. Server-side enforcement is authoritative.
 */
export function useUserRoles(): UseUserRolesResult {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<AuthorizationContext | null>(null);

  const fetchContext = async () => {
    if (!user) {
      setRoles([]);
      setPermissions([]);
      setIsSuperadmin(false);
      setContext(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_my_authorization_context');

      if (error || !data) {
        // Fail-secure: empty arrays on error
        console.error('Failed to fetch authorization context:', error?.message);
        setRoles([]);
        setPermissions([]);
        setIsSuperadmin(false);
        setContext(null);
        return;
      }

      const ctx = data as unknown as AuthorizationContext;
      setRoles(ctx.roles ?? []);
      setPermissions(ctx.permissions ?? []);
      setIsSuperadmin(ctx.is_superadmin ?? false);
      setContext(ctx);
    } catch (err) {
      // Fail-secure: empty arrays on error
      console.error('Authorization context fetch failed:', err);
      setRoles([]);
      setPermissions([]);
      setIsSuperadmin(false);
      setContext(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContext();
  }, [user?.id]);

  return { roles, permissions, isSuperadmin, loading, context, refetch: fetchContext };
}
