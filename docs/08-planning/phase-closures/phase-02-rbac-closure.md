# Phase 2 Closure Record — Access Control (RBAC)

> **Owner:** Project Lead | **Last Reviewed:** 2026-04-10

## Status

| Field | Value |
|-------|-------|
| **Phase** | Phase 2 — Access Control (RBAC) |
| **Status** | **CLOSED — A+ Institutional Grade** |
| **Closed Date** | 2026-04-10 |
| **Approved Baseline** | v7 |
| **Gate Score** | 12/12 |
| **Authoritative Evidence Actions** | ACT-015, ACT-019, ACT-020, ACT-021 |
| **Supersedes** | Prior review drafts v1–v7 (deleted per one-current-summary rule) |

---

## Architecture Summary

### Schema (5 tables)

- `roles` — dynamic role definitions with immutability protection
- `permissions` — granular permission keys
- `user_roles` — user-to-role assignments with assigned_by tracking
- `role_permissions` — role-to-permission mappings
- `audit_logs` — immutable audit trail with correlation IDs

### Security Helpers (4 SECURITY DEFINER functions)

- `is_superadmin()` — direct superadmin check
- `has_role()` — role membership check (by key or enum)
- `has_permission()` — permission check with logical superadmin inheritance + null-safety
- `get_my_authorization_context()` — returns full role/permission context for current user

### RLS (5 policies)

All tables have RLS enabled. Policies use `has_permission()` for `roles.view` and `audit.view`.

### Edge Functions (4 deployed)

- `assign-role` — requires `roles.assign` permission
- `revoke-role` — requires `roles.revoke` + last-superadmin guard
- `assign-permission-to-role` — requires `permissions.assign`
- `revoke-permission-from-role` — requires `permissions.revoke`

All include: JWT validation, permission checks via RPC, UUID format validation, entity existence checks, audit logging with rollback on audit failure, correlation_id.

### Seed Data

- 3 base roles: `superadmin`, `admin`, `user` (all `is_base=true`, `is_immutable=true`)
- 29 permissions matching `permission-index.md`
- Admin → 28 permissions (all except `jobs.emergency`)
- User → 5 self-scope permissions
- Auto-assign trigger on `auth.users` creation

---

## Gate Closure Evidence (12/12)

| # | Gate Item | Evidence | Action |
|---|-----------|----------|--------|
| 1 | Schema deployed | 5 tables confirmed via API (HTTP 200) | ACT-015, ACT-019 |
| 2 | Seed data populated | 3 roles, 29 permissions verified | ACT-015, ACT-019 |
| 3 | Security helpers work | All 4 functions tested with valid/invalid/null inputs | ACT-019 |
| 4 | RLS blocks anonymous | 0 rows returned from all tables with anon key; writes blocked | ACT-019 |
| 5 | Edge functions deployed & auth-gated | All 4 tested with real JWTs — superadmin success, user denied, no-auth denied | ACT-020 |
| 6 | Audit logging works | Audit rows verified with matching correlation_id after each mutation | ACT-020 |
| 7 | Last-superadmin guard | 409 on attempt to revoke last superadmin assignment | ACT-020 |
| 8 | Immutability triggers | Cannot modify key/is_base/is_immutable of immutable roles | ACT-015 |
| 9 | Allow matrix verified | Superadmin 29/29, Admin 28/29, User 5/29 via has_permission() | ACT-020, DW-003 |
| 10 | RLS tested at DB level | Anonymous read/write denial, helper fail-secure, null-safety | ACT-019, DW-004 |
| 11 | Cross-tenant isolation | N/A for v1 single-tenant (DEC-022) | ACT-019, DW-005 |
| 12 | Role change immediately reflected | No cache — fresh DB queries via RPC, confirmed immediate | ACT-020, DW-006 |

---

## Authenticated Runtime Evidence (ACT-020)

All tests used **real JWTs from Supabase Auth sign-in** (not service role, not mocked).

| Test | Result | Correlation ID |
|------|--------|---------------|
| assign-role (superadmin) | 200 success | 3964df25 |
| assign-role (regular user) | 403 denied | — |
| assign-role (no auth) | 401 | — |
| assign-role (duplicate) | 409 | — |
| revoke-role (superadmin) | 200 success | d5a3fa98 |
| revoke-role (last superadmin) | 409 guarded | — |
| assign-permission-to-role (superadmin) | 200 success | b2272b6a |
| assign-permission-to-role (regular user) | 403 denied | — |
| revoke-permission-from-role (superadmin) | 200 success | 2b1a4f86 |
| revoke-permission-from-role (regular user) | 403 denied | — |

---

## Bug Found & Fixed

**Issue:** `handle_new_user()` in migration `20260410041727` contained `INSERT INTO user_roles (user_id, role)` using non-existent `role` column.

**Resolution chain:**
1. MIG-007 (`20260410041727`) — introduced the bug
2. MIG-008 (`20260410043317`) — applied profile-only fix to live DB
3. MIG-009 (`20260410045232`) — authoritative corrective record (ACT-021)

**Current state:** `handle_new_user()` = profile creation only. `handle_new_user_role()` = role assignment via `role_id` lookup. Verified via `pg_proc`.

---

## Deferred Items Resolved

| DW ID | Title | Resolution |
|-------|-------|-----------|
| DW-003 | Permission allow/deny tests | Implemented (ACT-020) — authenticated matrix |
| DW-004 | DB-level RLS verification | Implemented (ACT-019) — runtime API tests |
| DW-005 | Cross-tenant isolation | Cancelled (DEC-022) — N/A for v1 single-tenant |
| DW-006 | Cache invalidation verification | Implemented (ACT-020) — no cache, fresh queries |

## Deferred Items Carried Forward

| DW ID | Title | Target Phase |
|-------|-------|-------------|
| DW-007 | Moderator role | Unassigned (v2) |
| DW-009 | requireRole() shared function | Phase 3 |
| DW-010 | requireSelfScope() shared function | Phase 3 |

---

## Next Phase Constraints

Phase 3 (Core Services) must:
1. Implement DW-009 (`requireRole()`) before any edge function uses role-based access
2. Implement DW-010 (`requireSelfScope()`) before user-management self-scope endpoints
3. Include RBAC integration testing as prerequisite before building on RBAC foundation

---

## Dependencies

- [Master Plan](../master-plan.md)
- [Action Tracker](../../06-tracking/action-tracker.md)
- [Deferred Work Register](../deferred-work-register.md)
- [Artifact Index](../../07-reference/artifact-index.md)
- [Database Migration Ledger](../../07-reference/database-migration-ledger.md)

## Related Documents

- [RBAC Module](../../04-modules/rbac.md)
- [Permission Index](../../07-reference/permission-index.md)
- [Approved Decisions](../approved-decisions.md)
