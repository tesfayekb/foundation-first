# Regression Watchlist

> **Owner:** Project Lead | **Last Reviewed:** 2026-04-08

## Purpose

Operational guardrail that tracks known regression risks, fragile areas, and past failures. Used as a mandatory pre-change verification checklist for every MEDIUM/HIGH impact change.

## Scope

All areas with known fragility, past regressions, or identified risk from the regression strategy and risk register.

## Enforcement Rule (CRITICAL)

- No MEDIUM/HIGH change may be completed without reviewing **all relevant** watchlist items
- Any relevant watchlist item not verified = change **cannot proceed**
- Watchlist verification must include evidence (test pass, runtime data, or documented manual check)
- Ignoring known watchlist risks is an **INVALID** change
- Critical-priority items must be checked **every time** their affected module changes

---

## Watchlist Entry Schema

Each watchlist item must include:

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Stable identifier (RW-XXX) |
| `area` | Yes | System area (auth, RBAC, caching, jobs, etc.) |
| `risk_description` | Yes | What can regress and how |
| `regression_class` | Yes | From Regression Strategy (functional, security, authorization, performance, caching, data integrity, audit, UX) |
| `priority` | Yes | Critical / High / Medium / Low |
| `affected_modules` | Yes | List of impacted modules |
| `trigger_conditions` | Yes | What change types activate this watchlist item |
| `detection_method` | Yes | How regression is detected |
| `required_checks` | Yes | Specific verification steps |
| `verification_type` | Yes | Code / automated test / runtime / manual / hybrid |
| `related_tests` | Yes (or justification) | Linked regression test IDs |
| `related_risk` | If applicable | Link to Risk Register entry |
| `recurrence_count` | Yes | How many times this has triggered |
| `owner` | Yes | Responsible for verification |
| `added_date` | Yes | When first identified |
| `last_verified` | Yes | Date of most recent verification |
| `status` | Yes | Active / Resolved / Archived |
| `resolution_date` | If resolved | When resolved |

---

## Active Watchlist

### RW-001: Permission Cache Invalidation Delay

| Field | Value |
|-------|-------|
| **Area** | Caching / RBAC |
| **Risk Description** | Role/permission change not immediately reflected in UI or API due to stale cache |
| **Regression Class** | Caching / Authorization |
| **Priority** | Critical |
| **Affected Modules** | rbac, caching, admin-panel, user-panel, api |
| **Trigger Conditions** | Any change to: cache TTL, invalidation triggers, RBAC logic, permission resolution |
| **Detection** | Permission cache invalidation tests, cross-tab sync tests, manual role-change verification |
| **Required Checks** | 1) Assign role → verify immediate API access. 2) Revoke role → verify immediate denial. 3) Verify cross-tab propagation |
| **Verification Type** | Automated test + runtime |
| **Related Tests** | RBAC invalidation suite, cache isolation tests |
| **Related Risk** | RISK-005 |
| **Recurrence Count** | 0 |
| **Owner** | Project Lead |
| **Added Date** | 2026-04-08 |
| **Last Verified** | — |
| **Status** | Active |

### RW-002: RLS Policy Change Causing Visibility Mismatch

| Field | Value |
|-------|-------|
| **Area** | Database / RLS |
| **Risk Description** | RLS policy modification causes rows to become visible or invisible unexpectedly across tenants |
| **Regression Class** | Authorization / Data Integrity |
| **Priority** | Critical |
| **Affected Modules** | database, auth, rbac, all data-access modules |
| **Trigger Conditions** | Any RLS policy change, migration on RLS-protected tables, schema change on tenant-scoped tables |
| **Detection** | Tenant isolation E2E tests, RLS-specific DB tests, cross-tenant query verification |
| **Required Checks** | 1) Tenant A cannot see tenant B rows. 2) Policy change takes immediate effect. 3) Query plans verified |
| **Verification Type** | Automated test |
| **Related Tests** | Tenant isolation suite, RLS policy tests |
| **Related Risk** | RISK-006 |
| **Recurrence Count** | 0 |
| **Owner** | Project Lead |
| **Added Date** | 2026-04-08 |
| **Last Verified** | — |
| **Status** | Active |

### RW-003: Shared Function Change Affecting Multiple Modules

| Field | Value |
|-------|-------|
| **Area** | Architecture / Shared Services |
| **Risk Description** | Modification to shared function silently breaks downstream consumers |
| **Regression Class** | Functional |
| **Priority** | High |
| **Affected Modules** | All modules consuming the changed function |
| **Trigger Conditions** | Any change to functions listed in function-index.md |
| **Detection** | Cross-module regression tests, snapshot tests on function outputs |
| **Required Checks** | 1) All consuming modules retested. 2) Function signature unchanged or consumers updated. 3) Golden dataset comparison |
| **Verification Type** | Automated test |
| **Related Tests** | Shared function regression suite |
| **Related Risk** | RISK-003 |
| **Recurrence Count** | 0 |
| **Owner** | Project Lead |
| **Added Date** | 2026-04-08 |
| **Last Verified** | — |
| **Status** | Active |

### RW-004: Job Retry Misconfiguration

| Field | Value |
|-------|-------|
| **Area** | Jobs / Scheduler |
| **Risk Description** | Retry count, backoff, or concurrency changes cause duplicate execution, retry storms, or silent failure |
| **Regression Class** | Functional / Performance |
| **Priority** | High |
| **Affected Modules** | jobs-and-scheduler, health-monitoring, audit-logging |
| **Trigger Conditions** | Any change to: job retry config, backoff logic, concurrency policy, kill switch |
| **Detection** | Job telemetry tests, retry behavior verification, DLQ depth monitoring |
| **Required Checks** | 1) Retry count matches config. 2) Backoff verified in logs. 3) No duplicate execution. 4) DLQ receives after max retries |
| **Verification Type** | Automated test + runtime |
| **Related Tests** | Job idempotency suite, retry behavior tests |
| **Related Risk** | RISK-008 |
| **Recurrence Count** | 0 |
| **Owner** | Project Lead |
| **Added Date** | 2026-04-08 |
| **Last Verified** | — |
| **Status** | Active |

### RW-005: Audit Event Missing After Mutation

| Field | Value |
|-------|-------|
| **Area** | Audit / Observability |
| **Risk Description** | Critical action completes but audit log entry is not created, causing compliance gap |
| **Regression Class** | Observability / Audit |
| **Priority** | High |
| **Affected Modules** | audit-logging, auth, rbac, user-management, admin-panel |
| **Trigger Conditions** | Any change to: mutation flows, audit emission logic, event structure, error handling paths |
| **Detection** | Audit reconciliation tests, event emission verification, audit completeness checks |
| **Required Checks** | 1) Every critical action produces audit entry. 2) All required fields present. 3) No sensitive data in logs. 4) Event count matches action count |
| **Verification Type** | Automated test |
| **Related Tests** | Audit integrity suite |
| **Related Risk** | — |
| **Recurrence Count** | 0 |
| **Owner** | Project Lead |
| **Added Date** | 2026-04-08 |
| **Last Verified** | — |
| **Status** | Active |

---

## Pre-Change Verification Workflow

Before completing any MEDIUM/HIGH impact change:

1. **Identify** affected modules from the change
2. **Pull** all watchlist items matching affected modules or trigger conditions
3. **Execute** required checks for each matching item
4. **Record** verification evidence (test run ID, screenshot, monitoring link)
5. **If any check fails** → change cannot proceed until resolved
6. **If new fragility discovered** → add new watchlist item before completing change

---

## Automatic Population Rules

Watchlist must be updated when:

| Event | Action |
|-------|--------|
| Regression detected (from regression strategy) | Add watchlist item |
| Risk materializes (from risk register) | Add watchlist item for affected area |
| Test failure reveals fragility | Add watchlist item |
| Post-release issue found | Add watchlist item |
| Manual verification finds edge case | Add watchlist item |
| Adversarial test reveals vulnerability | Add watchlist item |

**Rule:** Population is both manual and event-driven — any discovery of fragility must result in a watchlist entry.

---

## Recurrence Tracking and Escalation

| Recurrence Count | Action |
|-----------------|--------|
| 1 | Normal — item remains active |
| 2 | Warning — enhanced test coverage required |
| 3+ | **Escalate to Risk Register** if not already linked |
| 5+ | Mandatory architectural review — point fixes insufficient |

**Rules:**
- Recurrence count incremented each time the regression actually occurs (not each time checked)
- Recurrent items must be flagged in Top Fragile Areas summary
- Escalation creates Action Tracker entry

---

## Lifecycle Management

| Status | Definition | Rules |
|--------|-----------|-------|
| **Active** | Known risk, must be checked on relevant changes | Mandatory verification |
| **Resolved** | Root cause fixed, regression test in place | Must include resolution date + evidence |
| **Archived** | Stale (> 90 days resolved) or no longer relevant | Reviewed before archival |

### Cleanup Rules

- Resolved items remain for history — never deleted
- Items active > 90 days without verification → must be reviewed (confirm relevance or archive)
- Archival requires confirmation that:
  - Root cause addressed
  - Regression test exists (or justified exception)
  - No recent recurrence

---

## Testing Integration

- Every watchlist item **must** link to at least one regression test (if automatable)
- If no automated test exists, justification must be documented:

| Justification | Example |
|--------------|---------|
| Visual/layout only | Complex UI interaction not reliably automated |
| Environment-dependent | Requires production-like infra for meaningful test |
| Pending implementation | Test planned, not yet built (must have timeline) |

**Rule:** "Pending implementation" justification expires after 30 days — test must be built or item escalated.

---

## Action Tracker Integration

The following **MUST** create Action Tracker entries:

| Trigger | Severity | Target Resolution |
|---------|----------|-------------------|
| Watchlist check failure during change | HIGH | 24h (blocks change) |
| Repeated failure of same item (3+) | HIGH | Architectural review |
| Unresolved active item > 90 days | MEDIUM | Review/resolve within 1 week |
| Critical item triggered | CRITICAL | 4h |
| New critical item added | HIGH | Verification within 24h |

---

## Top Fragile Areas

### Most Critical Active Items

| Rank | ID | Area | Priority | Recurrence |
|------|----|------|----------|------------|
| 1 | RW-001 | Permission cache invalidation | Critical | 0 |
| 2 | RW-002 | RLS policy visibility | Critical | 0 |
| 3 | RW-003 | Shared function changes | High | 0 |
| 4 | RW-004 | Job retry configuration | High | 0 |
| 5 | RW-005 | Audit event completeness | High | 0 |

_Updated as items are added, triggered, or resolved._

---

## Link to Risk Register

- Watchlist = **tactical** (day-to-day change verification)
- Risk Register = **strategic** (system-level risk governance)
- Every watchlist item should reference a risk (if applicable)
- High-recurrence watchlist items must be escalated to risk register
- Risk materialization creates corresponding watchlist item for ongoing verification

---

## Dependencies

- [Regression Strategy](../05-quality/regression-strategy.md)
- [Change Control Policy](../00-governance/change-control-policy.md)
- [Risk Register](risk-register.md)
- [Testing Strategy](../05-quality/testing-strategy.md)

## Used By / Affects

All MEDIUM/HIGH impact changes — mandatory pre-change verification tool.

## Risks If Changed

MEDIUM — weakening watchlist verification directly increases regression risk across all modules.

## Related Documents

- [Regression Strategy](../05-quality/regression-strategy.md)
- [Risk Register](risk-register.md)
- [Action Tracker](action-tracker.md)
- [Testing Strategy](../05-quality/testing-strategy.md)
- [Function Index](../07-reference/function-index.md)
- [Permission Index](../07-reference/permission-index.md)
