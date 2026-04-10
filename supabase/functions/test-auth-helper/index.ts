/**
 * test-auth-helper — Internal test utility edge function.
 *
 * Creates a test user with admin permissions and returns a JWT.
 * Only works with service role key authorization.
 * NOT for production use — development/testing only.
 *
 * POST /test-auth-helper
 * Body: { action: "setup" | "teardown", email?: string }
 */
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow service role key
  const authHeader = req.headers.get('Authorization')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized — requires service role key' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const body = await req.json()
  const { action, email } = body

  if (action === 'setup') {
    const testEmail = email ?? `test-3c-${Date.now()}@test.local`
    const testPassword = 'TestPassword12345!'

    // Create user
    const { data: createData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })
    if (createErr) {
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = createData.user.id

    // Wait for profile trigger
    await new Promise(r => setTimeout(r, 500))

    // Assign superadmin role
    const { data: roles } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('key', 'superadmin')
      .single()

    if (roles) {
      await supabaseAdmin
        .from('user_roles')
        .insert({ user_id: userId, role_id: roles.id })
    }

    // Sign in to get JWT
    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    })
    const signInData = await signInRes.json()

    return new Response(JSON.stringify({
      user_id: userId,
      email: testEmail,
      access_token: signInData.access_token,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (action === 'teardown') {
    const { user_id } = body
    if (user_id) {
      await supabaseAdmin.auth.admin.deleteUser(user_id)
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
