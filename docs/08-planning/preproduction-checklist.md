# Pre-Production Checklist

> **Owner:** Project Lead | **Last Reviewed:** 2026-04-14

## Purpose

Authoritative list of manual actions and deferred items that **must** be completed before the first real user or at launch. These are not code tasks — they are operational, infrastructure, and configuration steps.

---

## Before First Real User

| # | Item | Details | Status |
|---|------|---------|--------|
| PP-001 | Register pre-signup hook in Supabase Dashboard | Auth → Hooks → "Before user is created" → select `auth-hook-pre-signup`. Required for signup gating to function. | `pending` |
| PP-002 | Configure custom SMTP (Resend) | Supabase Dashboard → Auth → Settings → SMTP. Required for branded auth emails and invitation delivery. | `pending` |

---

## At Launch

| # | Item | Details | Status |
|---|------|---------|--------|
| PP-003 | Set `VITE_SENTRY_DSN` in deployment platform | Add Sentry DSN as environment variable. Required for client-side error monitoring. | `pending` |
| PP-004 | DW-036 (Sentry) fully live | Complete Sentry integration — currently deferred. DSN must be set (PP-003) and error boundary wired. | `pending` |
| PP-005 | DW-012 (Integration tests) | Full integration test suite. Execute during QA sprint before launch. | `pending` |

---

## Completion Protocol

- Mark each item `done` with date when completed
- Items blocking launch must all be `done` before go-live
- "Before first real user" items must be completed before any production signups are enabled
