

## Two Final Hardening Fixes

Two targeted additions to make the governance system bulletproof.

---

### Fix 1 — Add "STOP if missing context" rule

**File:** `docs/00-governance/ai-operating-model.md`

Add rule 10 to the AI Behavior Rules list (after line 35):

```
10. If required documents (module, dependency, or reference) are missing or unclear, the AI must STOP and request clarification instead of making assumptions
```

This prevents hallucinated structure and silent corruption.

---

### Fix 2 — Add "Critical modules are always HIGH" rule

**File:** `docs/00-governance/change-control-policy.md`

Add a new subsection after the Impact Classification table (after line 33):

```markdown
### Critical Module Override

Auth, RBAC, and Security modules are ALWAYS classified as HIGH impact regardless of change scope. No exception.
```

Also add a corresponding note to `docs/00-governance/constitution.md` as a clarification under Rule 7 or as a standalone enforcement note.

---

### Memory Update

Update `mem://governance/constitution-rules` and `mem://governance/change-control` to reflect both additions.

---

### Technical Details

- **ai-operating-model.md line 35**: Insert rule 10 after rule 9
- **change-control-policy.md line 33**: Insert "Critical Module Override" subsection after the impact classification table
- **constitution.md**: Add clarifying note that auth/RBAC/security are permanently HIGH classification
- Memory files updated to match

Total: 3 doc files edited, 2 memory files updated. No application code changes.

