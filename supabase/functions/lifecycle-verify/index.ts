/**
 * lifecycle-verify — One-shot internal verification of deactivate→reactivate lifecycle.
 * Creates a test user, deactivates, verifies login blocked, reactivates, verifies login restored.
 * Requires service role key. Will be deleted after verification.
 */
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!
  
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results: string[] = []
  const log = (msg: string) => { results.push(msg); console.log(msg) }
  let testUserId = ''
  let adminToken = ''

  try {
    // Step 0: Get admin JWT for the superadmin user
    const testEmail = `lifecycle-verify-${Date.now()}@test.local`
    const testPass = 'LifecycleTest12345!'
    
    // Create test target user
    const { data: targetData, error: targetErr } = await admin.auth.admin.createUser({
      email: testEmail, password: testPass, email_confirm: true,
    })
    if (targetErr) throw new Error(`Create target failed: ${targetErr.message}`)
    testUserId = targetData.user.id
    log(`✅ 1/8 Created target user: ${testUserId}`)
    
    await new Promise(r => setTimeout(r, 600))

    // Create admin test user with superadmin role
    const adminEmail = `lifecycle-admin-${Date.now()}@test.local`
    const adminPass = 'AdminTest12345!'
    const { data: adminData, error: adminErr } = await admin.auth.admin.createUser({
      email: adminEmail, password: adminPass, email_confirm: true,
    })
    if (adminErr) throw new Error(`Create admin failed: ${adminErr.message}`)
    const adminUserId = adminData.user.id

    await new Promise(r => setTimeout(r, 600))

    // Assign superadmin
    const { data: saRole } = await admin.from('roles').select('id').eq('key', 'superadmin').single()
    if (saRole) {
      await admin.from('user_roles').insert({ user_id: adminUserId, role_id: saRole.id })
    }
    log(`✅ 2/8 Created admin user: ${adminUserId}`)

    // Sign in as admin
    const signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: adminEmail, password: adminPass }),
    })
    const signInData = await signInRes.json()
    adminToken = signInData.access_token
    if (!adminToken) throw new Error('Admin sign-in failed')
    log(`✅ 3/8 Admin signed in, got JWT`)

    // Step 1: Verify target can log in
    const login1 = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: testEmail, password: testPass }),
    })
    if (!login1.ok) { await login1.text(); throw new Error('Pre-deactivation login failed') }
    await login1.json()
    log(`✅ 4/8 Target can log in (pre-deactivation)`)

    // Step 2: Deactivate target via edge function
    const deactRes = await fetch(`${supabaseUrl}/functions/v1/deactivate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ user_id: testUserId, reason: 'lifecycle verification test' }),
    })
    const deactBody = await deactRes.json()
    if (!deactRes.ok) throw new Error(`Deactivate failed: ${JSON.stringify(deactBody)}`)
    log(`✅ 5/8 Deactivation succeeded: ${JSON.stringify(deactBody)}`)

    // Step 3: Verify target CANNOT log in
    const login2 = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: testEmail, password: testPass }),
    })
    const login2Body = await login2.text()
    if (login2.ok) throw new Error('CRITICAL: Deactivated user CAN still log in!')
    log(`✅ 6/8 Deactivated user correctly blocked from login (${login2.status})`)

    // Step 4: Reactivate target via edge function
    const reactRes = await fetch(`${supabaseUrl}/functions/v1/reactivate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
        'apikey': anonKey,
      },
      body: JSON.stringify({ user_id: testUserId, reason: 'lifecycle verification test' }),
    })
    const reactBody = await reactRes.json()
    if (!reactRes.ok) throw new Error(`Reactivate failed: ${JSON.stringify(reactBody)}`)
    log(`✅ 7/8 Reactivation succeeded: ${JSON.stringify(reactBody)}`)

    // Step 5: Verify target CAN log in again
    const login3 = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': anonKey },
      body: JSON.stringify({ email: testEmail, password: testPass }),
    })
    const login3Body = await login3.text()
    if (!login3.ok) throw new Error(`CRITICAL: Reactivated user CANNOT log in! Status: ${login3.status}, Body: ${login3Body}`)
    log(`✅ 8/8 Reactivated user can log in again`)

    log(`\n🏆 ALL 8/8 LIFECYCLE TESTS PASSED`)

    // Cleanup
    await admin.auth.admin.deleteUser(testUserId)
    await admin.auth.admin.deleteUser(adminUserId)
    log(`🧹 Cleaned up test users`)

    return new Response(JSON.stringify({ pass: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`❌ FAILED: ${msg}`)
    // Cleanup on failure
    if (testUserId) await admin.auth.admin.deleteUser(testUserId).catch(() => {})
    return new Response(JSON.stringify({ pass: false, results, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
