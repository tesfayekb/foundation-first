

# Plan: Fix All 7 Remaining Audit Issues to 100/100

## What This Achieves
Closes every gap identified in the final audit (scored 98.5/100) without introducing new drift or breaking any existing approved decisions.

---

## Step 1 — Supersede DEC-002 (Critical)

**Files:** `approved-decisions.md`, `plan-changelog.md`

- Mark DEC-002 as `superseded` by DEC-006
- Add **DEC-006: 11 Constitutional Rules** reflecting Rule 11 (Critical Module Override)
- Log the change in plan-changelog

---

## Step 2 — Add `normalizeRequest(input)` to Function Index

**File:** `function-index.md`

Full entry: classification `utility`, owner `api`, used by all edge functions, fail-secure behavior. The API module already references this function but the Function Index does not track it.

---

## Step 3 — Add `roles.create` and `roles.delete` to Permission Index

**File:** `permission-index.md`

Both are referenced in the Admin Panel module but have no Permission Index entries. Add full entries with admin-critical classification, system-wide scope, and appropriate re-auth policies (no re-auth for create, yes for delete as destructive).

---

## Step 4 — Annotate provisional `moderator` references

**Files:** `authorization-security.md`, `input-validation-and-sanitization.md`

OQ-004 asks whether moderator is in v1. Current references create implicit approval. Add explicit "provisional — see OQ-004" disclaimers without removing the content.

---

## Step 5 — Formally resolve OQ-003 (audit retention)

**Files:** `open-questions.md`, `approved-decisions.md`, `plan-changelog.md`

Config Index already defines `audit.retention_days = 90` (range 30-365). Close OQ-003 as resolved and create **DEC-007** to formalize the decision.

---

## Step 6 — Fix role-based permission matrix

**File:** `authorization-security.md`

Replace the role-column-based "Permission Levels" table with a permission-key-based version (using `users.view_all`, `roles.assign`, etc.) to match the system's permission-driven model. Add note pointing to Permission Index as authoritative source.

---

## Step 7 — Fix `app_role` vs `TEXT` type mismatch

**Files:** `authorization-security.md`, `input-validation-and-sanitization.md`

The `user_roles` CREATE TABLE uses `role TEXT` but `has_role()` uses `app_role` enum in the same document. Standardize to `app_role` to match the RBAC module. Update Zod example to reference the enum definition.

---

## Files Modified

| File | Steps |
|------|-------|
| `docs/08-planning/approved-decisions.md` | 1, 5 |
| `docs/08-planning/plan-changelog.md` | 1, 5 |
| `docs/07-reference/function-index.md` | 2 |
| `docs/07-reference/permission-index.md` | 3 |
| `docs/02-security/authorization-security.md` | 4, 6, 7 |
| `docs/02-security/input-validation-and-sanitization.md` | 4, 7 |
| `docs/08-planning/open-questions.md` | 5 |

## Risk

LOW — all changes are additive corrections or traceability fixes. No structural changes, no new patterns, no scope expansion.

