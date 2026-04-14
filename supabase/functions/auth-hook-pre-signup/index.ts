/**
 * auth-hook-pre-signup — Supabase Auth Pre-Signup Hook.
 *
 * Owner: user-onboarding module
 * Classification: security-critical
 * Lifecycle: active
 *
 * Registered in Supabase Dashboard → Auth → Hooks → "Before user is created".
 * Called by Supabase Auth server (not by client). Uses hook protocol:
 *   - Receives POST with { event, user } from Auth server
 *   - Returns { decision: "continue" } or { decision: "reject", message: "..." }
 *
 * Logic (per architecture decision #7 — no token validation):
 *   1. Read system_config → onboarding_mode
 *   2. If signup_enabled = false → reject (invited users bypass via inviteUserByEmail/service-role)
 *   3. If signup_enabled = true → continue
 *
 * NOTE: This hook is NOT called for inviteUserByEmail() — that uses service-role
 * and bypasses the hook entirely. So this only gates direct signups.
 *
 * CORS: Not needed — called server-to-server by Supabase Auth, not by browsers.
 * Auth: No JWT validation — Supabase Auth calls this internally.
 */
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST (Supabase Auth hook protocol)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ decision: 'reject', message: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Read onboarding mode from system_config
    const { data, error } = await supabaseAdmin
      .from('system_config')
      .select('value')
      .eq('key', 'onboarding_mode')
      .single()

    if (error || !data) {
      // Fail-open: if config is missing, allow signup
      // (prevents lockout if config is accidentally deleted)
      console.error('[PRE-SIGNUP HOOK] Failed to read system_config:', error?.message)
      return new Response(
        JSON.stringify({ decision: 'continue' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const config = data.value as { signup_enabled?: boolean; invite_enabled?: boolean }
    const signupEnabled = config.signup_enabled !== false // Default true if missing

    if (!signupEnabled) {
      return new Response(
        JSON.stringify({
          decision: 'reject',
          message: 'Registration is currently by invitation only. Please contact your administrator.',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Signup is enabled — allow registration
    return new Response(
      JSON.stringify({ decision: 'continue' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    // Fail-open on unexpected errors to prevent total signup lockout
    console.error('[PRE-SIGNUP HOOK] Unexpected error:', err)
    return new Response(
      JSON.stringify({ decision: 'continue' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
