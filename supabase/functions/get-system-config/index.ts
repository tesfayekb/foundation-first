/**
 * get-system-config — Public endpoint returning onboarding mode.
 *
 * Owner: user-onboarding module
 * Classification: api-standard
 * Lifecycle: active
 *
 * GET /get-system-config
 * No auth required — returns only non-sensitive config (signup/invite mode).
 * Used by SignUp page to check if self-registration is available.
 *
 * Response: { signup_enabled: boolean, invite_enabled: boolean }
 */
import { createHandler, apiSuccess } from '../_shared/handler.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(createHandler(async (req: Request) => {
  if (req.method !== 'GET') {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(405, 'Method not allowed', { correlationId: crypto.randomUUID() })
  }

  const { data, error } = await supabaseAdmin
    .from('system_config')
    .select('value')
    .eq('key', 'onboarding_mode')
    .single()

  if (error || !data) {
    // If config row missing, return safe defaults (both enabled)
    return apiSuccess({ signup_enabled: true, invite_enabled: true })
  }

  const config = data.value as { signup_enabled?: boolean; invite_enabled?: boolean }

  return apiSuccess({
    signup_enabled: config.signup_enabled !== false,
    invite_enabled: config.invite_enabled !== false,
  })
}))
