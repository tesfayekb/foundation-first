/**
 * useMfaFactors — list and unenroll MFA TOTP factors via Supabase Auth.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MfaFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
}

export function useMfaFactors() {
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [unenrolling, setUnenrolling] = useState(false);

  const listFactors = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setFactors((data?.totp ?? []) as MfaFactor[]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load MFA factors';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const unenrollFactor = useCallback(async (factorId: string) => {
    setUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setFactors((prev) => prev.filter((f) => f.id !== factorId));
      toast.success('MFA factor removed');
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove MFA factor';
      toast.error(message);
      return false;
    } finally {
      setUnenrolling(false);
    }
  }, []);

  return { factors, loading, unenrolling, listFactors, unenrollFactor };
}
