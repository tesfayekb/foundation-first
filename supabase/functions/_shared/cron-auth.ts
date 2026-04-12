/**
 * Cron job authentication — validates the X-Cron-Secret header
 * against the CRON_SECRET environment variable.
 *
 * All scheduled job edge functions MUST call verifyCronSecret()
 * before executing any logic. This prevents unauthorized invocation
 * of internal job endpoints using only the public anon key.
 *
 * Owner: jobs-and-scheduler module
 */

import { corsHeaders } from './cors.ts'

/**
 * Verifies that the incoming request carries a valid X-Cron-Secret header.
 * Returns null if valid, or a 401 Response if invalid.
 */
export function verifyCronSecret(req: Request): Response | null {
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected) {
    console.error('[CRON-AUTH] CRON_SECRET environment variable is not set')
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const provided = req.headers.get('X-Cron-Secret')
  if (!provided || provided !== expected) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return null // Valid
}
