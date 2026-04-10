/**
 * orphan-cleanup — One-shot cleanup of orphaned test users.
 * DELETE THIS FUNCTION immediately after use.
 */
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ORPHANS = [
  '3f0ab9e2-3409-4802-be9f-7f1f4b6bb0af',
  'd1e567db-83c4-4468-bdbe-1ba2861d5c88',
  '34840559-e7f4-4169-89d1-a79a4fef1133',
]

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const results: Array<{ id: string; step: string; success: boolean; error?: string }> = []

  for (const id of ORPHANS) {
    // 1. Delete profile
    const { error: profErr } = await supabaseAdmin.from('profiles').delete().eq('id', id)
    results.push({ id, step: 'delete_profile', success: !profErr, error: profErr?.message })

    // 2. Delete user_roles
    const { error: roleErr } = await supabaseAdmin.from('user_roles').delete().eq('user_id', id)
    results.push({ id, step: 'delete_roles', success: !roleErr, error: roleErr?.message })

    // 3. Delete auth user
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    results.push({ id, step: 'delete_auth', success: !authErr, error: authErr?.message })
  }

  // Verify none remain
  const { data: remaining } = await supabaseAdmin.auth.admin.listUsers()
  const stillOrphaned = remaining?.users?.filter(u => ORPHANS.includes(u.id)) ?? []

  return new Response(JSON.stringify({
    results,
    remaining_orphans: stillOrphaned.length,
    all_cleaned: stillOrphaned.length === 0,
  }, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
