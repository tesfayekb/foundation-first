/**
 * Stage 3C — Comprehensive authenticated edge function tests.
 *
 * Uses Supabase Admin API to create a dedicated test user, assign admin
 * roles/permissions, sign in to get a real JWT, and verify all endpoints.
 *
 * Coverage:
 * - Unauthenticated denial (401) × 5 endpoints
 * - Method denial (405) × 5 endpoints
 * - CORS preflight (200) × 5 endpoints
 * - Validation errors (400): invalid UUID, empty body, missing fields
 * - Authenticated self-access: get-profile (own), update-profile (own)
 * - Admin access: list-users with pagination
 * - Cross-user boundary: admin view_all → 404 for non-existent
 * - Self-deactivation block (400)
 * - Non-existent user deactivation (404)
 * - Non-existent user reactivation (404)
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts'

const BASE = Deno.env.get('VITE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function fnUrl(fn: string, query?: Record<string, string>): string {
  const base = `${BASE}/functions/v1/${fn}`;
  if (!query) return base;
  return `${base}?${new URLSearchParams(query)}`;
}

// ── Test user lifecycle ──────────────────────────────────────────
const TEST_EMAIL = `test-3c-${Date.now()}@test.local`
const TEST_PASSWORD = 'TestPassword12345!'
let testUserId = ''
let testToken = ''

/** Create test user via Admin API and sign in to get a JWT */
async function setupTestUser(): Promise<void> {
  if (!SERVICE_ROLE_KEY) throw new Error('SKIP: SUPABASE_SERVICE_ROLE_KEY not available')

  // Create user via admin API
  const createRes = await fetch(`${BASE}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    }),
  })
  const createData = await createRes.json()
  if (!createData.id) throw new Error(`Failed to create test user: ${JSON.stringify(createData)}`)
  testUserId = createData.id

  // Wait briefly for profile trigger
  await new Promise(r => setTimeout(r, 1000))

  // Assign superadmin role (gives all permissions)
  const roleRes = await fetch(`${BASE}/rest/v1/roles?key=eq.superadmin&select=id`, {
    headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` },
  })
  const roles = await roleRes.json()
  if (!roles?.[0]?.id) throw new Error('Could not find superadmin role')

  const assignRes = await fetch(`${BASE}/rest/v1/user_roles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ user_id: testUserId, role_id: roles[0].id }),
  })
  await assignRes.text() // consume

  // Sign in to get a real JWT
  const signInRes = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  })
  const signInData = await signInRes.json()
  if (!signInData.access_token) throw new Error(`Failed to sign in test user: ${JSON.stringify(signInData)}`)
  testToken = signInData.access_token
}

/** Delete test user via Admin API */
async function teardownTestUser(): Promise<void> {
  if (!testUserId || !SERVICE_ROLE_KEY) return
  const res = await fetch(`${BASE}/auth/v1/admin/users/${testUserId}`, {
    method: 'DELETE',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
  await res.text() // consume
}

// ═══════════════════════════════════════════════════════════════
// SETUP
// ═══════════════════════════════════════════════════════════════

Deno.test({ name: '00: SETUP — create test user', fn: setupTestUser, sanitizeResources: false, sanitizeOps: false })

// ═══════════════════════════════════════════════════════════════
// SECTION 1: UNAUTHENTICATED DENIAL (401)
// ═══════════════════════════════════════════════════════════════

for (const [fn, method, body] of [
  ['get-profile', 'GET', undefined],
  ['update-profile', 'PATCH', JSON.stringify({ display_name: 'Test' })],
  ['list-users', 'GET', undefined],
  ['deactivate-user', 'POST', JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000' })],
  ['reactivate-user', 'POST', JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000' })],
] as const) {
  Deno.test(`01: ${fn}: rejects unauthenticated (401)`, async () => {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${ANON_KEY}` }
    if (body) headers['Content-Type'] = 'application/json'
    const res = await fetch(fnUrl(fn), { method, headers, body: body as string | undefined })
    assertEquals(res.status, 401)
    await res.text()
  })
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: METHOD DENIAL (405)
// ═══════════════════════════════════════════════════════════════

for (const [fn, wrongMethod] of [
  ['get-profile', 'POST'],
  ['update-profile', 'GET'],
  ['list-users', 'POST'],
  ['deactivate-user', 'GET'],
  ['reactivate-user', 'GET'],
] as const) {
  Deno.test(`02: ${fn}: rejects wrong method (405)`, async () => {
    const res = await fetch(fnUrl(fn), {
      method: wrongMethod,
      headers: { 'Authorization': `Bearer ${ANON_KEY}` },
    })
    assertEquals(res.status, 405)
    await res.text()
  })
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: CORS PREFLIGHT (200)
// ═══════════════════════════════════════════════════════════════

for (const fn of ['get-profile', 'update-profile', 'list-users', 'deactivate-user', 'reactivate-user']) {
  Deno.test(`03: ${fn}: OPTIONS CORS preflight (200)`, async () => {
    const res = await fetch(fnUrl(fn), { method: 'OPTIONS' })
    assertEquals(res.status, 200)
    assertEquals(!!res.headers.get('access-control-allow-origin'), true)
    await res.text()
  })
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4: VALIDATION ERRORS (400)
// ═══════════════════════════════════════════════════════════════

Deno.test('04: get-profile: invalid UUID → 400', async () => {
  const res = await fetch(fnUrl('get-profile', { user_id: 'not-a-uuid' }), {
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY },
  })
  assertEquals(res.status, 400)
  await res.text()
})

Deno.test('04: update-profile: empty body → 400', async () => {
  const res = await fetch(fnUrl('update-profile'), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  assertEquals(res.status, 400)
  await res.text()
})

Deno.test('04: deactivate-user: missing user_id → 400', async () => {
  const res = await fetch(fnUrl('deactivate-user'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })
  assertEquals(res.status, 400)
  await res.text()
})

// ═══════════════════════════════════════════════════════════════
// SECTION 5: AUTHENTICATED SELF-ACCESS
// ═══════════════════════════════════════════════════════════════

Deno.test('05: get-profile: self-access returns own profile (200)', async () => {
  const res = await fetch(fnUrl('get-profile'), {
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY },
  })
  const body = await res.json()
  assertEquals(res.status, 200)
  assertExists(body.profile?.id)
  assertEquals(body.profile.id, testUserId)
  assertEquals(body.profile.status, 'active')
})

Deno.test('05: update-profile: self-update display_name (200)', async () => {
  const testName = `Stage3C_${Date.now()}`
  const res = await fetch(fnUrl('update-profile'), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ display_name: testName }),
  })
  const body = await res.json()
  assertEquals(res.status, 200)
  assertEquals(body.profile?.display_name, testName)
})

// ═══════════════════════════════════════════════════════════════
// SECTION 6: ADMIN ACCESS
// ═══════════════════════════════════════════════════════════════

Deno.test('06: list-users: admin pagination (200)', async () => {
  const res = await fetch(fnUrl('list-users', { limit: '5' }), {
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY },
  })
  const body = await res.json()
  assertEquals(res.status, 200)
  assertEquals(Array.isArray(body.users), true)
  assertEquals(typeof body.total, 'number')
})

Deno.test('06: get-profile: admin view non-existent user → 404', async () => {
  const res = await fetch(fnUrl('get-profile', { user_id: '00000000-0000-0000-0000-000000000001' }), {
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY },
  })
  assertEquals(res.status, 404)
  await res.text()
})

// ═══════════════════════════════════════════════════════════════
// SECTION 7: DEACTIVATION BOUNDARIES
// ═══════════════════════════════════════════════════════════════

Deno.test('07: deactivate-user: self-deactivation blocked (400)', async () => {
  const res = await fetch(fnUrl('deactivate-user'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: testUserId }),
  })
  assertEquals(res.status, 400)
  await res.text()
})

Deno.test('07: deactivate-user: non-existent user → 404', async () => {
  const res = await fetch(fnUrl('deactivate-user'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000001' }),
  })
  assertEquals(res.status, 404)
  await res.text()
})

Deno.test('07: reactivate-user: non-existent user → 404', async () => {
  const res = await fetch(fnUrl('reactivate-user'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${testToken}`, 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000001' }),
  })
  assertEquals(res.status, 404)
  await res.text()
})

// ═══════════════════════════════════════════════════════════════
// TEARDOWN
// ═══════════════════════════════════════════════════════════════

Deno.test({ name: '99: TEARDOWN — delete test user', fn: teardownTestUser, sanitizeResources: false, sanitizeOps: false })
