# Project

## ⚠️ AI Developer Instructions (MANDATORY)

**Before performing ANY task**, AI agents MUST read the governance bootstrap file for their platform:

| Platform | Bootstrap File | Format |
|----------|---------------|--------|
| **Lovable** | `.lovable/rules.md` | Auto-loaded by Lovable |
| **Cursor** | `.cursorrules` | Auto-loaded by Cursor |

These files enforce:
- **Execution gates** — code generation is blocked until `system-state.md` allows it
- **Mandatory reading order** — governance docs must be read before every task
- **9-step change control** — every change follows the documented workflow
- **Output format** — every task must produce the mandatory output format
- **Plan integrity** — approved sections cannot be dropped, stable IDs preserved

**If you are an AI and you skip these files, your work is INVALID.**

### Quick Reference

- **System State**: `docs/00-governance/system-state.md` — current phase and execution gates
- **Constitution**: `docs/00-governance/constitution.md` — 11 non-negotiable rules
- **Master Plan**: `docs/08-planning/master-plan.md` — approved execution plan (baseline v4)
- **Approved Decisions**: `docs/08-planning/approved-decisions.md` — binding decisions (DEC-001+)

### Documentation Structure

```
docs/
├── 00-governance/    — Constitution, change control, system state, AI rules
├── 01-architecture/  — Architecture overview, dependency map, design principles
├── 02-security/      — Auth security, authorization, input validation
├── 03-performance/   — Caching, DB performance, strategy
├── 04-modules/       — Module specs (auth, rbac, admin, user, audit, health, api, jobs)
├── 05-quality/       — Testing strategy, regression strategy
├── 06-tracking/      — Action tracker, risk register, regression watchlist
├── 07-reference/     — Function, permission, route, event, config, env var indexes
└── 08-planning/      — Master plan, approved decisions, changelog, review log
```
