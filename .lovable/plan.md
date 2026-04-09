

# Phase 2: RBAC Implementation Plan — Final Approved (with corrections)

## Summary

Implement dynamic-role-capable RBAC foundation: roles table (not enum), permissions table, security-definer helpers with logical superadmin inheritance, privileged server-side RPCs with transactional audit logging, tightened RLS, and client-side UX helpers. Phase 2 delivers the schema and backend foundation; operational dynamic-role CRUD UI is deferred to Phase 4.

---

## Correction Log (applied from your feedback)

1. **Doc wording fix**: `permissions.assign` / `permissions.revoke` added to Permission Index (not "Shared Functions" in rbac.md). Privileged functions `assign_permission_to_role()` / `revoke_permission_from_role()` added to Function Index.
2. **rbac.md phase nuance**: Will say "schema and backend are dynamic-role-capable; operational dynamic-role creation/deletion deferred to Phase 4 admin panel."
3. **Audit dependency clarified**: Phase 2 creates a minimal `audit_logs` table (append-only, same schema as audit-logging.md) specifically to support RBAC privileged action logging. Full audit module (query UI, export, retention jobs) remains Phase 3.
4. **Fail-secure tests explicitly listed**: null user, null permission, nonexistent permission key, malformed input.
5. **`get_my_authorization_context()` scoped to caller only**: Returns only the calling user's effective roles and permissions, not broad RBAC metadata.

---

## Step 1 — Doc Reconciliation (before any code)

**Files to update:**

| File | Changes |
|------|---------|
| `authorization-security.md` | Add `admin` to Base Roles table. Replace `app_role` enum SQL with `roles` table model. Remove stale `jobs.manage` from permission summary, use granular keys from Permission Index. |
| `permission-index.md` | Add `permissions.assign` and `permissions.revoke` entries (admin-critical, system-wide, default: admin + superadmin, audit required). |
| `function-index.md` | Rename `useUserRole()` → `useUserRoles()`. Update signature to return `{ roles, permissions, isSuperadmin, loading }`. Add entries for: `has_permission()`, `is_superadmin()`, `get_my_authorization_context()`, `assign_role()`, `revoke_role()`, `assign_permission_to_role()`, `revoke_permission_from_role()`. |
| `rbac.md` | Update conceptual schema from enum to roles table. Add phase nuance: "dynamic-role-capable foundation; operational CRUD deferred to Phase 4." |
| `event-index.md` | Verify `rbac.role_assigned`, `rbac.role_revoked`, `rbac.permission_assigned`, `rbac.permission_revoked`, `rbac.permission_denied` entries exist (they should already). |

---

## Step 2 — Database Migration: Schema

**Migration file**: `supabase/migrations/XXXX_rbac_schema.sql`

Four tables, all with RLS enabled:

```text
roles (id UUID PK, key TEXT UNIQUE, name TEXT, description TEXT, is_base BOOL, is_immutable BOOL, created_at, updated_at)
permissions (id UUID PK, key TEXT UNIQUE, description TEXT, created_at)
user_roles (id UUID PK, user_id → auth.users, role_id → roles, assigned_at, assigned_by → auth.users)
role_permissions (id UUID PK, role_id → roles, permission_id → permissions)
```

**Minimal audit_logs table** (same schema as audit-logging.md, append-only):
```text
audit_logs (id UUID PK, actor_id → auth.users, action TEXT, target_type TEXT, target_id UUID, metadata JSONB, ip_address INET, user_agent TEXT, created_at TIMESTAMPTZ)
```
- No UPDATE/DELETE policies — append-only enforced at DB level.

**DB-level immutability triggers:**
- Block DELETE on `roles` where `is_immutable = true`
- Block UPDATE of `key`, `is_base`, `is_immutable` on immutable roles
- Block deletion of last superadmin in `user_roles`

---

## Step 3 — Security Definer Helper Functions

| Function | Logic | Fail Behavior |
|----------|-------|---------------|
| `is_superadmin(user_id)` | Check if user has role with key='superadmin' | false on null/error |
| `has_role(user_id, role_key)` | Check user_roles join roles | false on null/error |
| `has_permission(user_id, permission_key)` | If `is_superadmin()` → true. Else check explicit role_permissions mappings. | false on null/error/nonexistent key |
| `get_my_authorization_context()` | Returns `{ roles[], permissions[], is_superadmin }` for `auth.uid()` only | null on error |

All are `SECURITY DEFINER` with `SET search_path = public`.

---

## Step 4 — RLS Policies (tightened)

| Table | SELECT | INSERT/UPDATE/DELETE |
|-------|--------|---------------------|
| `roles` | `has_permission(auth.uid(), 'roles.view')` OR `is_superadmin()` | No direct policies (deny) |
| `permissions` | Same as roles | No direct policies (deny) |
| `user_roles` | Own rows (`user_id = auth.uid()`) OR `has_permission(auth.uid(), 'roles.view')` | No direct policies (deny) |
| `role_permissions` | `has_permission(auth.uid(), 'roles.view')` OR `is_superadmin()` | No direct policies (deny) |
| `audit_logs` | `has_permission(auth.uid(), 'audit.view')` OR `is_superadmin()` | INSERT only via service_role (no client policies) |

---

## Step 5 — Privileged Edge Functions

Four Supabase Edge Functions, each following the same pattern:

| Function | Permission | Audit Event | Key Business Rules |
|----------|-----------|-------------|-------------------|
| `assign-role` | `roles.assign` | `rbac.role_assigned` | Validate target user + role exist |
| `revoke-role` | `roles.revoke` | `rbac.role_revoked` | Last-superadmin guard |
| `assign-permission-to-role` | `permissions.assign` | `rbac.permission_assigned` | Validate role + permission exist |
| `revoke-permission-from-role` | `permissions.revoke` | `rbac.permission_revoked` | Validate mapping exists |

Each function:
1. Validates JWT via `supabase.auth.getUser()` with service_role client
2. Checks permission via `has_permission()` RPC
3. Enforces business rules
4. Writes change + audit log in single transaction (rollback if audit fails)
5. Uses Zod for input validation
6. Includes CORS headers
7. Includes `correlation_id` in audit metadata

---

## Step 6 — Seed Data

**Second migration**: `supabase/migrations/XXXX_rbac_seed.sql`

1. **Base roles**: `superadmin` (is_base, is_immutable), `admin` (is_base, is_immutable), `user` (is_base, is_immutable)
2. **Permissions**: All active keys from permission-index.md (dynamically listed, not hardcoded count). Currently ~28 permissions including the 2 new ones.
3. **Role-permission mappings**:
   - superadmin: NO seeded rows (logical inheritance via `has_permission()`)
   - admin: all permissions except `jobs.emergency`
   - user: `users.view_self`, `users.edit_self`, `profile.self_manage`, `mfa.self_manage`, `session.self_manage`
4. **Auto-assign trigger**: `handle_new_user_role()` — inserts `user` role on new signup

---

## Step 7 — Client Helpers

| File | Component/Hook | Purpose |
|------|---------------|---------|
| `src/lib/rbac.ts` | `checkPermission(key)` | Checks cached permissions (UX only) |
| `src/hooks/useUserRoles.ts` | `useUserRoles()` | Calls `get_my_authorization_context()` RPC. Returns `{ roles, permissions, isSuperadmin, loading }`. Fail-secure: empty arrays on error. |
| `src/components/auth/RequirePermission.tsx` | `<RequirePermission permission="x">` | Hides children if permission absent. UX convenience only. |

---

## Step 8 — Phase Gate Testing and Documentation

**Required tests (explicit):**
- Allow/deny per base role for representative permissions
- Wrong-role denial
- Revoked-after-change: immediate access loss after role/permission revocation
- RLS boundary: direct DB queries as different roles
- Superadmin logical inheritance: new permission auto-available without seeding
- Self-scope boundary: user A cannot access user B's rows
- Last-superadmin protection trigger
- Immutable role protection triggers (delete + update blocked)
- Audit trail: every privileged RPC creates audit entry transactionally
- **Fail-secure explicit cases**: null user_id, null permission_key, nonexistent permission key, malformed UUID input

**Documentation updates:**
- `system-state.md` → RBAC status updated
- `master-plan.md` → Phase 2 gate checkboxes with evidence (ACT-NNN)
- `action-tracker.md` → new entries for each implementation step
- `function-index.md` → reconcile all new functions with actual UUIDs
- Security scan → zero new findings

---

## Execution Order

Strictly sequential: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

