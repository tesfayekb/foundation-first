## Fix Plan: Institutional-Grade Quality Enforcement

### 1. Add QUALITY MANDATE section to `.lovable/rules.md` and `.cursorrules`
New section covering:
- **Institutional-grade standard**: Every output must be A+, 100/100, production-grade
- **Security-first**: Every task must consider security implications, follow `docs/02-security/` guidelines
- **Performance-aware**: Every task must consider performance, follow `docs/03-performance/` guidelines
- **End-to-end verification**: After every implementation task, test end-to-end. If it fails, fix and retest until it passes
- **Auditable, diagnosable, testable**: Every piece of code must be auditable (clear trail), diagnosable (clear error paths), and testable (unit/integration/E2E ready)
- **Mandatory testing docs**: Link to `testing-strategy.md` and `regression-strategy.md` as required reading for implementation tasks

### 2. Strengthen Definition of Done
Add to the core checklist:
- End-to-end verification completed (tested, not assumed)
- Security implications assessed
- Performance implications assessed
- Code is auditable, diagnosable, and testable
- If tests fail → fix and retest until all pass (no partial passes accepted)

### 3. Update memory index
Add quality mandate to Core section so it's always in context.

### Files Modified:
- `.lovable/rules.md`
- `.cursorrules`
- `docs/00-governance/definition-of-done.md`
- `mem://index.md`
