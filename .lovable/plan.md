
# Plan: Fix All Remaining Audit Issues to 100/100

## Context
The final audit scored the system at 98.5/100 with 7 specific issues. This plan fixes all 7 without introducing new drift.

---

## Step 1 — Supersede DEC-002 (Critical)

**File:** `docs/08-planning/approved-decisions.md`

- Mark DEC-002 status as `superseded` with `Superseded By: DEC-006`
- Add new **DEC-006**: "11 Constitutional Rules" — identical to DEC-002 but referencing 11 rules (adds Rule 11: Critical Module Override)
- Record in `docs/08-planning/plan-changelog.md`

**Why:** Constitution has 11 rules; DEC-002 says 10. This is a factual contradiction.

---

## Step 2 — Add `normalizeRequest(input)` to Function Index

**File:** `docs/07-reference/function-index.md`

Add full entry:
- Classification: `utility`
- Owner module: `api`
- Used by: all edge functions
- Side effects: input mutation (trim, lowercase, sanitize)
- Related functions: `validateRequest()` (called after normalization)
- Fail behavior: fail-secure (reject malformed input)

**Why:** API module references it as shared; Function Index must track all shared functions.

---

## Step 3 — Add `roles.create` and `roles.delete` to Permission Index

**File:** `docs/07-reference/permission-index.md`

Add full entries for both:

**`roles.create`:**
- Module: rbac
- Classification: admin-critical
- Scope: system-wide
- Default roles: admin, superadmin
- Re-auth: No (per admin-panel module)
- Related routes: `/admin/roles` (POST)
- Related events: future `rbac.role_created`

**`roles.delete`:**
- Module: rbac
- Classification: admin-critical, destructive
- Scope: system-wide
- Default roles: admin, superadmin
- Re-auth: Yes
- Related routes: `/admin/roles/:id` (DELETE)
- Related events: future `rbac.role_deleted`

**Why:** Admin Panel module references both permissions but they have no Permission Index entries.

---

## Step 4 — Fix `moderator` references (OQ-004 is still open)

**Files:**
- `docs/02-security/authorization-security.md` — Add note to the Permission Levels table: "moderator role is provisional — see OQ-004. Do not implement until resolved."
- `docs/02-security/input-validation-and-sanitization.md` — Add comment to the Zod schema example noting moderator is provisional per OQ-004.

**Why:** OQ-004 asks whether moderator is in v1 scope. References without a disclaimer create implicit approval.

---

## Step 5 — Resolve OQ-003 status

**File:** `docs/08-planning/open-questions.md`

- Change OQ-003 status from `Open` to `Resolved`
- Add reference: "Resolved by config-index.md — `audit.retention_days` default 90 days, range 30–365"
- Add corresponding **DEC-007** in `approved-decisions.md`

**Why:** Config Index already defines `audit.retention_days = 90` with allowed range 30-365. The question is answered but not formally closed.

---

## Step 6 — Fix authorization-security.md permission matrix

**File:** `docs/02-security/authorization-security.md`

Replace the role-based "Permission Levels" table (lines 166-177) with a permission-based version that uses permission keys (`users.view_all`, `roles.assign`, `admin.access`, `audit.view`, `admin.config`) instead of capability descriptions mapped to role columns. Add note that this is a baseline summary and the authoritative source is `permission-index.md`.

**Why:** The current table uses role-column-based determinants, contradicting the system's permission-driven model.

---

## Step 7 — Align `app_role` enum with base role model

**File:** `docs/02-security/authorization-security.md`

The `has_role()` SQL uses `app_role` enum type, but the `user_roles` table above it uses `role TEXT`. Standardize: either both use `app_role` enum or both use `TEXT`. The RBAC module uses `app_role`, so update the `user_roles` CREATE TABLE in authorization-security.md to use `role app_role NOT NULL` instead of `role TEXT NOT NULL`.

Also in `docs/02-security/input-validation-and-sanitization.md`: update the Zod example to note that valid roles come from the `app_role` enum definition, not a hardcoded list.

**Why:** Type mismatch between the two SQL blocks in the same document is a consistency gap.

---

## Files Modified (Summary)

| File | Steps |
|------|-------|
| `docs/08-planning/approved-decisions.md` | 1, 5 |
| `docs/08-planning/plan-changelog.md` | 1, 5 |
| `docs/07-reference/function-index.md` | 2 |
| `docs/07-reference/permission-index.md` | 3 |
| `docs/02-security/authorization-security.md` | 4, 6, 7 |
| `docs/02-security/input-validation-and-sanitization.md` | 4, 7 |
| `docs/08-planning/open-questions.md` | 5 |

## Risk Assessment

- **Drift risk:** LOW — all changes are additive or corrective alignment; no structural changes
- **Plan integrity:** All changes follow Rule 8 (supersession with traceability) and Rule 10 (merge, not rewrite)
- **No new patterns introduced** — all entries follow existing schemas
