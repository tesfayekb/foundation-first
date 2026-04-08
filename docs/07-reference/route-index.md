# Route Index

> **Owner:** Project Lead | **Last Reviewed:** 2026-04-08 | **Status:** Living Document | **Index Version:** `route-v1.0`

## Purpose

Central registry and **route governance system** for all application routes and API endpoints. This document is the single source of truth for route definitions — it governs access control (permission-based, not role-based), request/response contracts, audit requirements, and testing expectations.

## Scope

All frontend routes and API endpoints across all modules.

---

## Enforcement Rule (CRITICAL)

| Rule | Description |
|------|-------------|
| **Completeness** | No route may exist outside this index. Undocumented route = invalid implementation. |
| **Permission-based access** | Protected routes must use permission-based access control from the Permission Index, not role-based checks. |
| **Server enforcement** | Protected routes must not rely on UI hiding alone — server-side enforcement required. |
| **Traceability** | Every protected route must map to at least one Permission Index entry. |
| **Change control** | Route changes (path, access, contract) require change control. |
| **No hidden routes** | Internal/debug routes in production are prohibited unless documented and governed. |

---

## Route Classification Model

| Classification | Description | Governance Level |
|---------------|-------------|-----------------|
| **public** | No authentication required; accessible to all | Standard |
| **authenticated** | Requires valid session; no specific permission | Medium |
| **privileged** | Requires specific permission(s) from Permission Index | High — permission-linked |
| **destructive** | Enables irreversible or high-impact actions | Highest — re-auth + audit |
| **internal** | System/health endpoints, not user-facing | Medium — access-controlled |

---

## Route Entry Schema

### Frontend Route Fields

| Field | Description | Required |
|-------|-------------|----------|
| `path` | URL path pattern | Yes |
| `page` | Page/component name | Yes |
| `module` | Owning module | Yes |
| `classification` | From classification model | Yes |
| `auth_required` | Whether authentication is required | Yes |
| `permission_required` | Permission key(s) from Permission Index | If protected |
| `scope` | `self`, `tenant`, `system-wide` | If protected |
| `panel` | `public`, `user-panel`, `admin-panel` | Yes |
| `reauth_required` | Whether re-authentication is needed for actions | If destructive |
| `related_functions` | Shared functions used by this route | If applicable |
| `related_events` | Events emitted from this route | If applicable |
| `related_tests` | Tests covering this route | If applicable |
| `related_risks` | Risk register items | If applicable |
| `lifecycle` | `active`, `deprecated`, `pending-removal` | Yes |

### API Route Fields (additional)

| Field | Description | Required |
|-------|-------------|----------|
| `method` | HTTP method (GET, POST, PUT, DELETE, PATCH) | Yes |
| `request_schema` | Expected request body/params (Zod schema reference) | If applicable |
| `response_contract` | Response shape and status codes | Yes |
| `rate_limit_class` | Rate limiting tier (`standard`, `strict`, `relaxed`) | Yes |
| `audit_required` | Whether actions generate audit events | Yes |
| `idempotent` | Whether the endpoint is idempotent | Yes |

---

## Sensitive Route Rules

Routes classified as `destructive` or `privileged` with system-wide scope:

| Rule | Description |
|------|-------------|
| **Re-auth** | May require re-authentication before action |
| **Audit** | All actions must generate audit events |
| **Approval** | Route changes require Lead approval |
| **Double confirmation** | Destructive actions should require user confirmation in UI |

---

## Testing Requirements

| Test Type | Applies To | Description |
|-----------|-----------|-------------|
| **Authenticated allow** | All protected routes | Verify correct permission grants access |
| **Unauthenticated deny** | All protected routes | Verify unauthenticated request returns 401 |
| **Unauthorized deny** | All privileged routes | Verify wrong permission returns 403 |
| **Scope boundary** | Scoped routes | Verify user cannot exceed their scope |
| **Public access** | Public routes | Verify no auth required |
| **E2E coverage** | Critical routes | Full user flow testing |
| **Rate limit** | API routes | Verify rate limiting enforced |

**Rule:** Every protected route must have at minimum an allow test and a deny test.

---

## Route Lifecycle

| State | Description | Action Required |
|-------|-------------|-----------------|
| **Active** | In use, governed by this index | Standard governance |
| **Deprecated** | Scheduled for removal | Redirect plan + sunset date |
| **Pending removal** | Will be removed in next release | All references updated |

---

## Frontend Route Registry

### Public Routes

#### `/` — Landing

| Field | Value |
|-------|-------|
| **Page** | Landing |
| **Module** | — |
| **Classification** | public |
| **Auth required** | No |
| **Panel** | public |
| **Related tests** | Landing page render test |
| **Lifecycle** | active |

#### `/login` — Login

| Field | Value |
|-------|-------|
| **Page** | Login |
| **Module** | auth |
| **Classification** | public |
| **Auth required** | No |
| **Panel** | public |
| **Related functions** | `authenticateRequest()` |
| **Related events** | `auth.signed_in`, `auth.failed_attempt` |
| **Related tests** | Login flow tests, failed login tests |
| **Related risks** | RSK-001 (credential compromise) |
| **Lifecycle** | active |

#### `/signup` — Sign Up

| Field | Value |
|-------|-------|
| **Page** | Sign Up |
| **Module** | auth |
| **Classification** | public |
| **Auth required** | No |
| **Panel** | public |
| **Related events** | `auth.signed_up` |
| **Related tests** | Signup flow tests, validation tests |
| **Lifecycle** | active |

#### `/forgot-password` — Password Reset

| Field | Value |
|-------|-------|
| **Page** | Password Reset |
| **Module** | auth |
| **Classification** | public |
| **Auth required** | No |
| **Panel** | public |
| **Related events** | `auth.password_reset` |
| **Related tests** | Password reset flow tests |
| **Related risks** | RSK-001 |
| **Lifecycle** | active |

### User Panel Routes (Authenticated)

#### `/dashboard` — User Dashboard

| Field | Value |
|-------|-------|
| **Page** | User Dashboard |
| **Module** | user-panel |
| **Classification** | authenticated |
| **Auth required** | Yes |
| **Permission required** | *(authenticated session only — no specific permission)* |
| **Scope** | self |
| **Panel** | user-panel |
| **Related functions** | `getCurrentUser()`, `requireAuth()` |
| **Related tests** | Dashboard render test, unauthenticated deny test |
| **Lifecycle** | active |

#### `/settings` — User Settings

| Field | Value |
|-------|-------|
| **Page** | User Settings |
| **Module** | user-panel |
| **Classification** | authenticated |
| **Auth required** | Yes |
| **Permission required** | *(authenticated session only)* |
| **Scope** | self |
| **Panel** | user-panel |
| **Related functions** | `getCurrentUser()`, `getUserProfile()`, `updateUserProfile()` |
| **Related events** | `user_panel.settings_changed` |
| **Related tests** | Settings render test, update flow test |
| **Lifecycle** | active |

#### `/settings/security` — MFA Settings

| Field | Value |
|-------|-------|
| **Page** | MFA Settings |
| **Module** | user-panel |
| **Classification** | authenticated |
| **Auth required** | Yes |
| **Permission required** | *(authenticated session only)* |
| **Scope** | self |
| **Panel** | user-panel |
| **Reauth required** | Yes (sensitive security action) |
| **Related events** | `auth.mfa_enrolled`, `user_panel.session_revoked` |
| **Related tests** | MFA enrollment tests, session revocation tests |
| **Lifecycle** | active |

### Admin Panel Routes (Privileged)

#### `/admin` — Admin Dashboard

| Field | Value |
|-------|-------|
| **Page** | Admin Dashboard |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related functions** | `requireAuth()`, `checkPermission()` |
| **Related tests** | Admin access allow/deny suite |
| **Related risks** | RSK-002 (privilege escalation) |
| **Lifecycle** | active |

#### `/admin/users` — User Management

| Field | Value |
|-------|-------|
| **Page** | User Management |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `users.view_all` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related functions** | `listUsers()`, `checkPermission()` |
| **Related tests** | User management allow/deny suite |
| **Lifecycle** | active |

#### `/admin/users/:id/roles` — Role Assignment

| Field | Value |
|-------|-------|
| **Page** | Role Assignment (within User Management) |
| **Module** | admin-panel |
| **Classification** | privileged, destructive |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `roles.assign` / `roles.revoke` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Reauth required** | Yes |
| **Related functions** | `has_role()`, `checkPermission()` |
| **Related events** | `rbac.role_assigned`, `rbac.role_revoked` |
| **Related risks** | RSK-002 (privilege escalation) |
| **Related watchlist** | RW-001 |
| **Related tests** | Role assign/revoke allow/deny suite |
| **Lifecycle** | active |

#### `/admin/roles` — Role Management

| Field | Value |
|-------|-------|
| **Page** | Role Management |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `roles.view` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related tests** | Role listing allow/deny tests |
| **Lifecycle** | active |

#### `/admin/audit` — Audit Logs

| Field | Value |
|-------|-------|
| **Page** | Audit Logs |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `audit.view` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related functions** | `queryAuditLogs()` |
| **Related tests** | Audit view allow/deny tests |
| **Lifecycle** | active |

#### `/admin/audit/export` — Audit Export

| Field | Value |
|-------|-------|
| **Page** | Audit Export (within Audit Logs) |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `audit.export` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Audit required** | Yes (compliance-sensitive data export) |
| **Related tests** | Audit export allow/deny suite |
| **Lifecycle** | active |

#### `/admin/monitoring` — Health Dashboard

| Field | Value |
|-------|-------|
| **Page** | Health Dashboard |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `monitoring.view` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related functions** | `getSystemHealth()` |
| **Related tests** | Monitoring view allow/deny tests |
| **Lifecycle** | active |

#### `/admin/monitoring/config` — Alert Configuration

| Field | Value |
|-------|-------|
| **Page** | Alert Configuration (within Health Dashboard) |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `monitoring.configure` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Audit required** | Yes |
| **Related tests** | Monitoring config allow/deny tests |
| **Lifecycle** | active |

#### `/admin/config` — System Config

| Field | Value |
|-------|-------|
| **Page** | System Config |
| **Module** | admin-panel |
| **Classification** | privileged, destructive |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `admin.config` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Reauth required** | Yes |
| **Audit required** | Yes |
| **Related events** | `admin.config_changed` |
| **Related tests** | Config change allow/deny suite |
| **Lifecycle** | active |

#### `/admin/jobs` — Jobs Dashboard

| Field | Value |
|-------|-------|
| **Page** | Jobs Dashboard |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `jobs.view` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Related tests** | Jobs view allow/deny tests |
| **Lifecycle** | active |

#### `/admin/jobs/:id/trigger` — Manual Job Trigger

| Field | Value |
|-------|-------|
| **Page** | Job Trigger (within Jobs Dashboard) |
| **Module** | admin-panel |
| **Classification** | privileged |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `jobs.trigger` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Audit required** | Yes |
| **Related events** | `job.started` |
| **Related tests** | Job trigger allow/deny suite |
| **Lifecycle** | active |

#### `/admin/jobs/deadletter` — Dead-Letter Management

| Field | Value |
|-------|-------|
| **Page** | Dead-Letter Management |
| **Module** | admin-panel |
| **Classification** | privileged, destructive |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `jobs.deadletter.manage` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Reauth required** | Yes |
| **Audit required** | Yes |
| **Related events** | `job.replayed`, `job.dead_lettered` |
| **Related risks** | RSK-007 (job failure cascade) |
| **Related tests** | Dead-letter management allow/deny suite |
| **Lifecycle** | active |

#### `/admin/jobs/emergency` — Kill Switch

| Field | Value |
|-------|-------|
| **Page** | Kill Switch |
| **Module** | admin-panel |
| **Classification** | privileged, destructive |
| **Auth required** | Yes |
| **Permission required** | `admin.access` + `jobs.emergency` |
| **Scope** | system-wide |
| **Panel** | admin-panel |
| **Reauth required** | Yes |
| **Audit required** | Yes |
| **Related events** | `job.kill_switch_activated` |
| **Related risks** | RSK-007 |
| **Related tests** | Kill switch allow/deny suite, emergency flow E2E |
| **Lifecycle** | active |

---

## API Endpoint Registry

### System Endpoints

#### `GET /health` — Health Check

| Field | Value |
|-------|-------|
| **Module** | health-monitoring |
| **Classification** | internal |
| **Auth required** | No |
| **Purpose** | System health check for monitoring and load balancers |
| **Response contract** | `200: { status: "healthy" | "degraded" | "down", checks: {...} }` |
| **Rate limit class** | relaxed |
| **Audit required** | No |
| **Idempotent** | Yes |
| **Related functions** | `getSystemHealth()` |
| **Related tests** | Health endpoint tests |
| **Lifecycle** | active |

> Additional API endpoints will be added as modules are implemented. Each must follow the full schema above, including method, auth model, permission model, request/response contract, rate limit class, and audit requirements.

---

## Critical Route Summary

### Highest-Risk Routes (Strongest Governance)

| Route | Classification | Permission | Why Critical |
|-------|---------------|------------|--------------|
| `/admin/jobs/emergency` | privileged, destructive | `jobs.emergency` | System-wide job halt |
| `/admin/config` | privileged, destructive | `admin.config` | System behavior changes |
| `/admin/users/:id/roles` | privileged, destructive | `roles.assign` / `roles.revoke` | Privilege escalation risk |
| `/admin/jobs/deadletter` | privileged, destructive | `jobs.deadletter.manage` | Failure resolution impact |
| `/login` | public | — | Authentication entry point |

### Public Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/login` | Authentication |
| `/signup` | Registration |
| `/forgot-password` | Password recovery |
| `GET /health` | System health |

### Destructive Routes (Require Re-Auth)

| Route | Permission | Re-Auth |
|-------|-----------|---------|
| `/admin/config` | `admin.config` | Yes |
| `/admin/users/:id/roles` | `roles.assign` / `roles.revoke` | Yes |
| `/admin/jobs/deadletter` | `jobs.deadletter.manage` | Yes |
| `/admin/jobs/emergency` | `jobs.emergency` | Yes |
| `/settings/security` | *(authenticated)* | Yes |

---

## Dependencies

- [Permission Index](permission-index.md) — route access maps to permissions
- [Function Index](function-index.md) — routes use shared functions
- [Event Index](event-index.md) — routes trigger events
- [Change Control Policy](../00-governance/change-control-policy.md) — route changes follow change control
- [Action Tracker](../06-tracking/action-tracker.md) — route changes create entries
- [Risk Register](../06-tracking/risk-register.md) — route-related risks tracked

## Related Documents

- [Auth Module](../04-modules/auth.md)
- [Admin Panel Module](../04-modules/admin-panel.md)
- [User Panel Module](../04-modules/user-panel.md)
- [Architecture Overview](../01-architecture/architecture-overview.md)
