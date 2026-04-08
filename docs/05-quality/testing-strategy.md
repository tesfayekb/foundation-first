# Testing Strategy

> **Owner:** Project Lead | **Last Reviewed:** 2026-04-08

## Purpose

Defines the testing governance, enforcement rules, domain coverage, and operational integration for a permission-driven, RLS-enforced, audit-heavy, multi-tenant system.

## Scope

All application code: components, hooks, utilities, API endpoints, edge functions, RLS policies, RBAC enforcement, job system, caching behavior, and audit integrity.

## Enforcement Rule (CRITICAL)

- No code may merge without required test coverage for its classification
- No critical-path change may merge without integration test AND E2E validation
- No security-sensitive change may merge without explicit security tests
- Any failing test **blocks release** — no bypass without documented exception and approval
- Tests must be **deterministic** — flaky tests are invalid and must be fixed or removed
- Retries are not an acceptable fix for flaky tests
- Test coverage drops on critical modules block merge

---

## Test Pyramid

| Level | Tool | Coverage Target | What to Test |
|-------|------|----------------|-------------|
| **Unit** | Vitest | 80%+ general, 95%+ critical modules | Utilities, hooks, pure functions, permission logic, validation |
| **Integration** | Vitest + Testing Library | Key flows + all permission boundaries | Component interactions, API calls, RLS enforcement, cache behavior |
| **E2E** | Playwright | All critical user journeys | Auth, MFA, RBAC, admin actions, tenant isolation, job visibility, health dashboard |
| **Performance** | k6 / custom | Critical endpoints | Load tests, p95/p99 validation, regression detection |

---

## Test Domain Coverage Matrix

Each system domain has specific testing requirements:

| Domain | Unit | Integration | E2E | Performance | Failure Tolerance |
|--------|------|------------|-----|-------------|-------------------|
| **Auth & Session** | Required | Required | Required | Required | Zero |
| **RBAC / Permissions** | Required | Required | Required | — | Zero |
| **RLS Enforcement** | — | Required (DB-level) | Required | — | Zero |
| **API Layer** | Required | Required | Critical paths | Required | Zero for auth/RBAC |
| **Jobs & Scheduler** | Required | Required | Admin visibility | — | Zero for critical jobs |
| **Audit Logging** | Required | Required | Spot checks | — | Zero |
| **Health Monitoring** | Required | Required | Dashboard load | — | Low |
| **Admin Panel** | Required | Required | Required | — | Zero for privilege actions |
| **User Panel** | Required | Required | Key flows | — | Low |
| **Caching Behavior** | Required | Required | — | — | Zero for permission cache |
| **Frontend Components** | Required | Key interactions | — | — | Low |

---

## RBAC / RLS Testing Requirements

### Permission Testing Model

For **every** permission-protected resource, tests must verify:

| Scenario | Expected Result | Required |
|----------|----------------|----------|
| Authorized user with correct role | Success | Yes |
| Unauthorized user (no role) | Denied (403) | Yes |
| Wrong tenant user | Denied (403/404) | Yes |
| Expired session | Denied (401) | Yes |
| Role just assigned | Immediate access | Yes |
| Role just revoked | Immediate denial | Yes |
| Multiple roles (additive) | Combined permissions | Yes |
| Cache invalidation after role change | Fresh permission state | Yes |

### RLS-Specific Tests

- RLS must be tested at the **database level**, not just API level
- Tests must use multiple authenticated contexts (different users, roles, tenants)
- Tests must verify:
  - Row visibility matches policy
  - Row mutation respects policy
  - Cross-tenant queries return zero rows (not errors)
  - Policy changes take immediate effect

---

## Multi-Tenant Isolation Testing

**Mandatory Test Scenarios:**

| Test | Verification |
|------|-------------|
| Tenant A queries tenant B data via API | Returns empty or 403 — never tenant B data |
| Tenant A queries tenant B data via direct DB (RLS) | Returns zero rows |
| Cache isolation: tenant A cache not served to tenant B | Verified via scoped cache keys |
| Admin panel: admin in tenant A cannot manage tenant B | UI and API enforcement |
| Cross-tenant join attempts | Fail or return scoped results only |
| Tenant membership change | Immediate cache invalidation + access update |

---

## Test Data Strategy

### Requirements

- Test datasets must include realistic scenarios:

| Tier | Users | Roles | Audit Records | Purpose |
|------|-------|-------|--------------|---------|
| Small | 5–10 | 2–3 | < 100 | Unit/integration speed |
| Medium | 50–100 | 5–10 | 1,000–10,000 | Integration/E2E realism |
| Large | 500+ | 10+ | 100,000+ | Performance/scale testing |

### Rules

- Seeded datasets must mimic production patterns (multiple roles per user, cross-team relationships, audit volume)
- Test data must not contain real PII
- Test data generation must be reproducible and version-controlled
- Database state must be reset between test suites (no cross-test contamination)

---

## Failure and Chaos Testing

### Required Failure Scenarios

| Scenario | Verify |
|----------|--------|
| Database unavailable | Graceful degradation, no data corruption |
| External API failure | Circuit breaker activates, fallback behavior |
| Cache layer failure | System functions correctly (degraded latency, not broken) |
| Job execution failure | Retry behavior, dead-letter handling |
| Partial system degradation | Core auth/permission flows remain functional |
| Auth provider unavailable | Appropriate error messaging, no security bypass |

### Rules

- No failure scenario may result in security bypass or data corruption
- Failure tests must verify audit logging continues (or failure is logged)
- Graceful degradation behavior must match Performance Strategy degradation policy

---

## Job System Testing

Tied to [Jobs and Scheduler Module](../04-modules/jobs-and-scheduler.md) governance:

| Test | Verification |
|------|-------------|
| Idempotency | Same job executed twice produces same result |
| Retry behavior | Correct retry count, backoff, max attempts |
| Dead-letter path | Failed jobs move to DLQ after max retries |
| Poison job detection | Immediately-failing jobs detected and isolated |
| Concurrency policy | No duplicate execution within same schedule window |
| Backpressure | Queue depth limits respected |
| Kill switch | Job stops immediately when kill switch activated |
| Pre/post condition validation | Data integrity checks execute correctly |
| Telemetry emission | All required telemetry fields emitted |

---

## Caching Behavior Testing

Tied to [Caching Strategy](../03-performance/caching-strategy.md) governance:

| Test | Verification |
|------|-------------|
| Cache key correctness | Keys include all required scoping dimensions |
| Tenant isolation | Tenant A cache never served to tenant B |
| User isolation | User A private cache never accessible to user B |
| Permission-sensitive invalidation | Role change invalidates permission cache immediately |
| Stale data boundaries | Data not served beyond defined staleness SLA |
| Cache miss fallback | System functions correctly on cold/empty cache |
| Cross-tab invalidation | Logout/permission change propagates across tabs |
| Global cache version bump | Old-version entries treated as misses |

---

## Audit Integrity Testing

Tied to [Audit Logging Module](../04-modules/audit-logging.md) governance:

| Test | Verification |
|------|-------------|
| Critical action produces audit log | Every defined auditable action creates entry |
| Audit log completeness | All required fields present (actor, action, target, timestamp, IP) |
| Start/terminal events for jobs | No orphaned start-without-end entries |
| Sensitive data exclusion | No passwords, tokens, MFA secrets in audit logs |
| Audit immutability | No update/delete paths accessible from application |
| Audit read access | Only users with `audit.view` permission can read logs |
| Audit reconciliation | Audit count matches expected action count |

---

## Performance Testing

### Integration with CI/Staging

| Test Type | Environment | Frequency | Pass Criteria |
|-----------|------------|-----------|---------------|
| Endpoint latency (critical paths) | CI/staging | Every release | p95 within budget |
| Load test (auth, admin) | Staging | Before major release | p99 within budget, no errors |
| Query performance | CI | Every migration | No plan regression |
| Bundle size | CI | Every build | Within budget |
| Core Web Vitals | Staging/production | Continuous | LCP < 2.5s, CLS < 0.1 |

### Rules

- Performance regression vs baseline must be detected and flagged
- New endpoints must include performance test before release
- Performance test results must be stored for trend analysis

---

## Test Environment Strategy

| Environment | Purpose | Data | Infrastructure | Speed |
|------------|---------|------|---------------|-------|
| **Local** | Development + unit/integration | Mocked/seeded | Local DB, mocked services | Fast |
| **CI** | Automated gate | Seeded, deterministic | Ephemeral, real DB | Medium |
| **Staging** | Pre-production validation | Realistic (anonymized) | Production-like | Slow |
| **Production** | Post-deploy monitoring | Real | Real | N/A (observability only) |

### Rules

- Tests must not depend on external services unless explicitly integration-testing those services
- CI tests must complete within defined time budget (unit < 2min, integration < 5min, E2E < 10min)
- Staging must mirror production configuration (RLS, permissions, connection pooling)

---

## Test Determinism and Flakiness Rules

- No reliance on real wall-clock time without controlled mocking
- No random/nondeterministic behavior in test assertions
- No test order dependencies — each test must be independently runnable
- No shared mutable state between tests
- Flaky tests must be:
  - Quarantined immediately
  - Fixed within 48 hours or removed
  - Never masked by retry loops
- Test timeout must be defined and enforced (unit: 5s, integration: 15s, E2E: 30s per test)

---

## Coverage Governance

### Coverage Targets by Module

| Module | Line Coverage | Branch Coverage | Rule |
|--------|-------------|----------------|------|
| Auth & session | ≥ 95% | ≥ 90% | Merge blocker |
| RBAC / permissions | ≥ 95% | ≥ 90% | Merge blocker |
| RLS policies | 100% of policies tested | — | Merge blocker |
| Jobs & scheduler | ≥ 90% | ≥ 85% | Merge blocker |
| Audit logging | ≥ 90% | ≥ 85% | Merge blocker |
| API layer | ≥ 85% | ≥ 80% | Warning at threshold |
| UI components | ≥ 80% | ≥ 70% | Advisory |
| Utilities/hooks | ≥ 90% | ≥ 85% | Warning at threshold |

### Rules

- Coverage must include edge cases, failure paths, and permission boundaries — not just happy paths
- Coverage reports must be generated in CI and tracked over time
- Coverage drop on critical modules = merge blocker

---

## SSOT Traceability

Tests must map to system requirements:

| SSOT Document | Test Mapping |
|--------------|-------------|
| Master Plan (requirements) | Feature tests cover each requirement |
| Permission Index | Every permission has at least one allow + deny test |
| Route Index | Every route has at least one integration/E2E test |
| Event Index | Every critical event has emission verification test |
| Regression Watchlist | Every watchlist item has regression test |

### Rules

- New requirements, permissions, or routes must include test coverage in the same change
- Orphaned tests (testing removed features) must be cleaned up
- Test-to-requirement mapping reviewed quarterly

---

## E2E Scope

### Required E2E Flows

| Flow | Priority |
|------|----------|
| Sign up → verify → first login | Critical |
| Login → MFA → session | Critical |
| Session restore / token refresh | Critical |
| RBAC enforcement across UI panels | Critical |
| Admin: assign/revoke role → verify effect | Critical |
| Admin: deactivate user → verify lockout | Critical |
| Tenant switching (if applicable) | Critical |
| Job visibility in admin panel | High |
| Health dashboard load + data correctness | High |
| Audit log viewing in admin panel | High |
| Cache invalidation on permission change (UI-level) | High |
| Password reset flow | Critical |
| Logout → cache clear → re-auth required | Critical |

---

## Release Gating Rules

CI/CD pipeline must enforce:

| Gate | Condition | Bypass Allowed |
|------|----------|---------------|
| Unit tests pass | All pass | No |
| Integration tests pass | All pass | No |
| E2E critical tests pass | All pass | No |
| Coverage threshold met | Per-module targets | No for critical modules |
| Performance budget met | Bundle size, endpoint latency | Documented exception only |
| Security tests pass | Auth, RBAC, RLS tests | No |
| No flaky tests | Zero quarantined tests running | No |

### Rules

- No deploy if critical tests fail — no exception
- Security test failure = release blocker + Action Tracker entry
- Regression test failure = release blocker + investigation required

---

## Action Tracker Integration

The following **MUST** create Action Tracker entries:

| Trigger | Severity | Target Resolution |
|---------|----------|-------------------|
| Critical test failure in CI | HIGH | 24h |
| Security test failure | CRITICAL | 4h |
| Recurring flaky test (> 3 occurrences) | MEDIUM | 48h |
| Regression detected | HIGH | 24h |
| Coverage drop on critical module | MEDIUM | 1 week |
| E2E critical flow failure | HIGH | 24h |
| Performance regression detected | MEDIUM | 1 week |

---

## Test File Convention

- Unit/Integration: `*.test.ts` or `*.test.tsx` co-located with source
- E2E: `e2e/*.spec.ts`
- Test utilities/helpers: `src/test/` directory
- Test fixtures/data: `src/test/fixtures/` directory

---

## Dependencies

- [Performance Strategy](../03-performance/performance-strategy.md) — performance budgets and test requirements
- [Caching Strategy](../03-performance/caching-strategy.md) — cache behavior test requirements
- [Security Architecture](../02-security/security-architecture.md) — security test requirements
- [Jobs and Scheduler](../04-modules/jobs-and-scheduler.md) — job testing requirements
- [Audit Logging](../04-modules/audit-logging.md) — audit integrity test requirements
- [RBAC Module](../04-modules/rbac.md) — permission test requirements

## Used By / Affects

All modules — testing strategy is the enforcement layer for the entire system.

## Risks If Changed

HIGH — weakening test requirements directly increases regression, security, and data integrity risk across all modules.

## Related Documents

- [Regression Strategy](regression-strategy.md)
- [Definition of Done](../00-governance/definition-of-done.md)
- [Change Control Policy](../00-governance/change-control-policy.md)
- [Permission Index](../07-reference/permission-index.md)
- [Route Index](../07-reference/route-index.md)
- [Event Index](../07-reference/event-index.md)
