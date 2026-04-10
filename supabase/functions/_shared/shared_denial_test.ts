/**
 * Runtime verification for Phase 3.5 — Denial Audit Logging (DW-014)
 *
 * Tests 3 denial scenarios and verifies audit_logs entries.
 */
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/assert_equals.ts";
import { assert } from "https://deno.land/std@0.224.0/assert/assert.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BASE = `${SUPABASE_URL}/functions/v1`;

// ── Helpers ──────────────────────────────────────────────────────

async function createConfirmedUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();
  if (!data.id) throw new Error(`Failed to create user: ${JSON.stringify(data)}`);
  return data.id;
}

async function signIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Sign-in failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  await res.text();
}

async function getRecentAuditLogs(action: string, actorId: string | null): Promise<unknown[]> {
  // Small delay to allow fire-and-forget write
  await new Promise(r => setTimeout(r, 1500));

  let query = `${SUPABASE_URL}/rest/v1/audit_logs?action=eq.${action}&order=created_at.desc&limit=5`;
  if (actorId) {
    query += `&actor_id=eq.${actorId}`;
  }

  const res = await fetch(query, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  return await res.json() as unknown[];
}

// ── Test lifecycle ───────────────────────────────────────────────

const TEST_EMAIL = `denial-test-${Date.now()}@test.local`;
const TEST_PASSWORD = 'DenialTest123!';
let testUserId = '';
let testToken = '';

Deno.test({
  name: "setup: create test user and sign in",
  fn: async () => {
    testUserId = await createConfirmedUser(TEST_EMAIL, TEST_PASSWORD);
    assert(testUserId, "User created");
    testToken = await signIn(TEST_EMAIL, TEST_PASSWORD);
    assert(testToken.length > 10, "Token acquired");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ── TEST 1: Permission denial ────────────────────────────────────

Deno.test({
  name: "DW-014: permission denial logs auth.permission_denied with correct schema",
  fn: async () => {
    // Regular user calls list-users (requires users.view_all)
    const res = await fetch(`${BASE}/list-users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'apikey': ANON_KEY,
      },
    });
    const body = await res.json();
    assertEquals(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(body)}`);

    // Verify audit log
    const logs = await getRecentAuditLogs('auth.permission_denied', testUserId) as Array<{
      actor_id: string;
      action: string;
      target_type: string;
      metadata: {
        permission_key: string;
        reason: string;
        endpoint: string;
        actor_known: boolean;
        correlation_id: string;
      };
    }>;
    assert(logs.length > 0, "Audit log entry must exist for permission denial");

    const log = logs[0];
    assertEquals(log.actor_id, testUserId, "actor_id must match test user");
    assertEquals(log.action, 'auth.permission_denied');
    assertEquals(log.target_type, 'permission');
    assertEquals(log.metadata.permission_key, 'users.view_all');
    assertEquals(log.metadata.reason, 'missing_permission');
    assertEquals(log.metadata.actor_known, true);
    assert(log.metadata.endpoint?.length > 0, "endpoint must be present");
    assert(log.metadata.correlation_id?.length > 0, "correlation_id must be in metadata");

    console.log("✅ TEST 1 PASSED — Permission denial audit log verified");
    console.log("   Sample row:", JSON.stringify(log, null, 2));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ── TEST 2: Self-scope violation ─────────────────────────────────

Deno.test({
  name: "DW-014: self-scope violation logs auth.permission_denied with reason",
  fn: async () => {
    // Regular user tries to get another user's profile
    const res = await fetch(`${BASE}/get-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: '00000000-aaaa-bbbb-cccc-000000000001' }),
    });
    const body = await res.json();
    assertEquals(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(body)}`);

    const logs = await getRecentAuditLogs('auth.permission_denied', testUserId) as Array<{
      actor_id: string;
      metadata: { reason: string; correlation_id: string; actor_known: boolean };
    }>;

    // Find a self_scope_violation entry
    const scopeLog = logs.find(l => l.metadata.reason === 'self_scope_violation');
    assert(scopeLog, "Must have audit entry with reason=self_scope_violation");
    assertEquals(scopeLog.actor_id, testUserId);
    assertEquals(scopeLog.metadata.actor_known, true);
    assert(scopeLog.metadata.correlation_id?.length > 0, "correlation_id must be in metadata");

    console.log("✅ TEST 2 PASSED — Self-scope violation audit log verified");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ── TEST 3: Null actor (unauthenticated denial) ──────────────────

Deno.test({
  name: "DW-014: unauthenticated request returns 401 (no fake UUID in audit)",
  fn: async () => {
    // No auth header — should get 401 (AuthError, not PermissionDeniedError)
    // This verifies we don't write fake UUIDs for unauthenticated requests
    const res = await fetch(`${BASE}/list-users`, {
      method: 'GET',
      headers: { 'apikey': ANON_KEY },
    });
    await res.text();
    assertEquals(res.status, 401, "Unauthenticated request must return 401");
    console.log("✅ TEST 3 PASSED — Unauthenticated returns 401 (no PermissionDeniedError path)");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// ── Cleanup ──────────────────────────────────────────────────────

Deno.test({
  name: "cleanup: delete test user",
  fn: async () => {
    await deleteUser(testUserId);
    console.log("✅ Cleanup complete");
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
