

## SSOT Documentation System — Final A+ Institutional-Grade Plan

42 markdown files across 9 directories. No application code — documentation phase only.

---

### Full Directory Structure

```text
docs/
├── 00-governance/
│   ├── constitution.md
│   ├── system-state.md
│   ├── ai-operating-model.md
│   ├── documentation-standard.md
│   ├── change-control-policy.md
│   └── definition-of-done.md
├── 01-architecture/
│   ├── architecture-overview.md
│   ├── system-design-principles.md
│   ├── project-structure.md
│   └── dependency-map.md
├── 02-security/
│   ├── security-architecture.md
│   ├── auth-security.md
│   ├── authorization-security.md
│   └── input-validation-and-sanitization.md
├── 03-performance/
│   ├── performance-strategy.md
│   ├── database-performance.md
│   └── caching-strategy.md
├── 04-modules/
│   ├── auth.md
│   ├── rbac.md
│   ├── user-management.md
│   ├── admin-panel.md
│   ├── user-panel.md
│   ├── audit-logging.md
│   ├── health-monitoring.md
│   ├── api.md
│   └── jobs-and-scheduler.md
├── 05-quality/
│   ├── testing-strategy.md
│   └── regression-strategy.md
├── 06-tracking/
│   ├── action-tracker.md
│   ├── regression-watchlist.md
│   └── risk-register.md
├── 07-reference/
│   ├── function-index.md
│   ├── route-index.md
│   ├── permission-index.md
│   ├── event-index.md
│   ├── config-index.md
│   └── env-var-index.md
└── 08-planning/
    ├── master-plan.md
    ├── plan-changelog.md
    ├── approved-decisions.md
    ├── open-questions.md
    └── plan-review-log.md
```

---

### Document Template (ALL files)

Every file includes:
- **Owner** + **Last Reviewed** (header metadata)
- Title, Purpose, Scope
- Key Rules / Principles
- Dependencies
- Used By / Affects
- Risks If Changed
- Related Documents

**Module files** additionally include: Shared Functions, Events (emitted/consumed), Jobs, Permissions, Risks If Modified.

---

### Section 1: Governance Rules (NON-NEGOTIABLE — constitution.md)

1. No application code may be generated during documentation phase
2. No code change allowed without updating impacted documentation
3. No new pattern may be introduced if an existing one exists
4. No task is complete without Definition of Done checklist
5. No duplicate or conflicting documentation allowed
6. **Shared component protection**: Any function/service used in 2+ modules MUST be tracked in `function-index.md` with all usage points listed; index MUST be updated if modified
7. **No silent behavior change**: No change may alter behavior of existing flows without documenting the change, identifying impacted modules, and updating system-state
8. **Approved plan preservation rule**: Once a plan section is marked `approved` or `approved-with-modifications`, it may NOT be dropped, rewritten, or contradicted in later plans unless: (a) the prior approved section is explicitly referenced by its stable ID, (b) the reason for change is documented, (c) affected docs are listed, (d) the change is recorded in `plan-changelog.md` with a `superseded-by` link, (e) the updated section is re-approved
9. **Execution lock rule** (NEW): No implementation may begin from a proposed or partially revised plan. Execution may ONLY use the latest approved baseline in `master-plan.md`. Any section not in `approved` or `approved-partial` status is off-limits for execution.
10. **Plan merge rule** (NEW): When a revised plan is created, it MUST merge new proposals into the current approved baseline rather than regenerate the plan from scratch. The approved baseline is the starting document; revisions are additive diffs, not replacements.

---

### Section 2: AI Operating Model (ai-operating-model.md)

**Mandatory Reading Order (every task):**
1. `constitution.md`
2. `system-state.md`
3. `approved-decisions.md`
4. `master-plan.md`
5. Relevant module docs
6. `dependency-map.md` (if shared logic involved)
7. Reference indexes (if shared components involved)

**AI Behavior Rules:**
- Must read governance + relevant module docs before any action
- Must identify impacted modules first
- Must follow change-control workflow
- Must not introduce new patterns if existing ones apply
- Must not generate code without updating documentation
- Must reference approved plan baseline before execution
- Must never execute against a proposed or partially revised plan

**Mandatory AI Output Format (every task):**
```
## Change Summary
## Modules Impacted
## Docs Updated
## References Updated
## Verification Status
## Risks / Follow-up
```

**Mandatory Plan Revision Output Format (every plan update):**
```
## Plan Version
## Sections Preserved (unchanged from approved baseline, listed by ID)
## Sections Modified (with ID, reason, superseded-by link)
## New Sections Added (with new IDs)
## Sections Removed (with ID, justification, reference to prior approval)
## Approved Decisions Affected (by decision ID)
## Review Required (yes/no, which section IDs)
```

---

### Section 3: Change Control Workflow (MANDATORY 9-step)

1. Read `constitution.md` and `system-state.md`
2. Read all relevant module documents
3. Identify impacted modules and references
4. Plan changes before implementation
5. Implement changes
6. Update ALL affected documentation
7. Update `action-tracker.md`
8. Verify (tests or runtime if required)
9. Update `system-state.md` if system state changed

**Impact Classification:**
- **LOW**: isolated module, no shared dependencies
- **MEDIUM**: affects shared services or multiple modules
- **HIGH**: affects auth, RBAC, schema, shared functions, or security

Rules:
- MEDIUM/HIGH → must plan before implementation
- HIGH → must verify against `regression-watchlist.md`

---

### Section 4: Regression Protection Loop

Before completing any MEDIUM/HIGH change:
1. Check `regression-watchlist.md`
2. Verify affected flows are not broken
3. If new risk discovered → add to `regression-watchlist.md`

---

### Section 5: Definition of Done (globally enforced)

No task is complete unless:
- All impacted docs updated
- `action-tracker.md` updated
- Impacted modules verified
- `regression-watchlist.md` checked (for MEDIUM/HIGH)
- AI output format included in response
- `system-state.md` updated if state changed
- Plan artifacts updated if plan-level changes occurred

---

### Section 6: Plan Governance (08-planning/)

**Stable IDs (NEW):** Every section in `master-plan.md` and every item in `approved-decisions.md` MUST have a stable identifier. Format: `PLAN-{MODULE}-{NNN}` for plan sections (e.g. `PLAN-AUTH-001`, `PLAN-RBAC-003`) and `DEC-{NNN}` for decisions (e.g. `DEC-001`, `DEC-012`). IDs are permanent and never reassigned.

**master-plan.md** — The current canonical plan. Every section has a stable ID and a status:
- `proposed` / `approved` / `approved-partial` (NEW) / `approved-with-modifications` / `deferred` / `rejected` / `implemented`
- `approved-partial`: used when a subsection is approved but sibling subsections within the same section are not yet approved. Allows granular approval without forcing mixed-status rewrites.
- Once approved, a section remains until explicitly changed through change control

**plan-changelog.md** — Tracks every plan revision with **superseded-by linkage** (NEW):
- Each entry includes: section ID changed, what changed, why, what stayed, what was added, what was removed, approval status
- For any changed approved section: `prior_section_id`, `superseded_by` (new section ID), `date`, `reason`
- Historical tracing: any decision can be traced back through its supersession chain

**approved-decisions.md** — Anti-forgetting ledger. Every approved plan section is recorded here with its stable ID (`DEC-{NNN}`). Future plan revisions MUST preserve these unless explicitly superseded with documented rationale and a `superseded-by` link back to the original decision ID.

**open-questions.md** — Unresolved items tracked separately from approved items.

**plan-review-log.md** — Logs each review round: version reviewed, section IDs approved, section IDs modified, section IDs sent back for revision.

**Diff requirement**: Before accepting any revised plan, a diff against the approved baseline must be produced showing: sections unchanged (by ID), sections modified (by ID with reason), newly added (with new IDs), removed (by ID with justification), and conflicts with previously approved decisions (by decision ID).

**Merge rule**: Revised plans merge into the approved baseline. The approved baseline is the starting document. Revisions are additive diffs applied on top — never a from-scratch regeneration.

**Execution lock**: Only sections in `approved` or `approved-partial` status may be executed. Proposed, deferred, or rejected sections are not actionable.

---

### Section 7: System State (system-state.md)

```
status: initializing SSOT
phase: documentation-only
code_generation: blocked
modules_implemented: none
active_work: documentation structure creation
current_plan_version: v0
approved_plan_baseline: none
plan_status: not yet created
```

**Update rule**: MUST be updated if architecture changes, module status changes, phase changes, or plan version changes.

---

### Section 8: Reference Index Format

All reference files use impact-map tables:

| Name | Module | Used By | Impact If Changed |
|------|--------|---------|-------------------|

Placeholder rows initially.

---

### Section 9: Feature Scope (locked)

- Authentication (email + social + MFA)
- RBAC (dynamic permission system)
- Admin panel + User panel
- Audit logging + Health monitoring
- API layer
- Background jobs / scheduler

---

### Section 10: Project Memory

Save to `mem://index.md` and detailed memory files:
- SSOT structure and file list
- All 10 non-negotiable constitution rules (including plan preservation, execution lock, merge rule)
- Change-control workflow (9 steps)
- Mandatory reading order (approved-decisions before master-plan)
- Impact classification system
- AI output format requirements (task + plan revision)
- Stable ID convention (`PLAN-{MODULE}-{NNN}`, `DEC-{NNN}`)
- Plan section statuses including `approved-partial`
- Superseded-by linkage requirement
- Feature scope constraints

Add to Lovable project knowledge:
> "Approved plan sections are authoritative once recorded in `/docs/08-planning/master-plan.md` and `/docs/08-planning/approved-decisions.md` with stable IDs. Revised plans must merge into the approved baseline (never regenerate from scratch) and preserve all approved sections unless an explicit superseding change is documented in `plan-changelog.md` with prior section ID, superseded-by link, date, and reason, then sent for re-approval. Execution may only use sections in approved or approved-partial status from the latest approved baseline."

---

### Implementation Steps

1. Create all 9 directories under `/docs`
2. Write **governance files** (constitution with all 10 rules, AI operating model with reading order + both output formats + diff/merge requirements, change-control with impact classification + regression loop, definition-of-done, documentation-standard with ownership template, system-state with plan version fields)
3. Write **architecture files** (overview, design principles, project structure, dependency map)
4. Write **security files** (architecture, auth, authorization, input validation)
5. Write **performance files** (strategy, database, caching)
6. Write **all 9 module files** with full dependency/event/permission/risk sections
7. Write **quality + tracking files** (testing strategy, regression strategy with protection loop, action tracker, regression watchlist, risk register)
8. Write **reference index files** as impact-map tables
9. Write **planning files** (master-plan with stable IDs and `approved-partial` status, plan-changelog with superseded-by linkage, approved-decisions with `DEC-` IDs, open-questions, plan-review-log)
10. Save governance rules, SSOT structure, stable ID conventions, and plan-preservation rules to **project memory**

