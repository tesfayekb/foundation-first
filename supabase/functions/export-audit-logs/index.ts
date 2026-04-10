/**
 * export-audit-logs — CSV export of audit logs.
 *
 * Permission: audit.export
 * Classification: privileged, compliance-sensitive
 * Audit risk: HIGH-RISK (fail-closed — abort if audit write fails)
 *
 * Constraints:
 *   - Max export: 10,000 rows
 *   - Format: CSV
 *   - Sort: created_at ASC (chronological for compliance)
 *   - The export action itself is audited as high-risk
 *   - Allowed filters: action, actor_id, target_type, date_from, date_to
 */
import { createHandler, apiSuccess } from '../_shared/handler.ts'
import { authenticateRequest } from '../_shared/authenticate-request.ts'
import { checkPermissionOrThrow } from '../_shared/authorization.ts'
import { logAuditEvent } from '../_shared/audit.ts'
import { apiError } from '../_shared/api-error.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'
import { corsHeaders } from '../_shared/cors.ts'

const MAX_EXPORT_ROWS = 10_000

Deno.serve(createHandler(async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    return apiError(405, 'Method not allowed')
  }

  const ctx = await authenticateRequest(req)
  await checkPermissionOrThrow(ctx.user.id, 'audit.export')

  const url = new URL(req.url)
  const params = url.searchParams

  // Parse filters
  const action = params.get('action')?.trim() || null
  const actorId = params.get('actor_id')?.trim() || null
  const targetType = params.get('target_type')?.trim() || null
  const dateFrom = params.get('date_from')?.trim() || null
  const dateTo = params.get('date_to')?.trim() || null

  // Validate UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (actorId && !uuidRegex.test(actorId)) {
    return apiError(400, 'Invalid actor_id format', { code: 'VALIDATION_ERROR', field: 'actor_id', correlationId: ctx.correlationId })
  }
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    return apiError(400, 'Invalid date_from format', { code: 'VALIDATION_ERROR', field: 'date_from', correlationId: ctx.correlationId })
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    return apiError(400, 'Invalid date_to format', { code: 'VALIDATION_ERROR', field: 'date_to', correlationId: ctx.correlationId })
  }

  // ─── HIGH-RISK AUDIT: Log the export action BEFORE executing ───
  const auditResult = await logAuditEvent({
    actorId: ctx.user.id,
    action: 'audit.exported',
    targetType: 'audit_logs',
    metadata: {
      filters: { action, actorId, targetType, dateFrom, dateTo },
      max_rows: MAX_EXPORT_ROWS,
    },
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    correlationId: ctx.correlationId,
  })

  // FAIL-CLOSED: Abort export if audit write failed
  if (!auditResult.success) {
    console.error('[EXPORT-AUDIT-LOGS] Audit write failed — aborting export (fail-closed)', {
      code: auditResult.code,
      reason: auditResult.reason,
      correlationId: ctx.correlationId,
    })
    return apiError(503, 'Export unavailable: audit integrity check failed', {
      code: 'AUDIT_INTEGRITY_FAILURE',
      correlationId: ctx.correlationId,
    })
  }

  // Build query — chronological for compliance
  let query = supabaseAdmin
    .from('audit_logs')
    .select('id, actor_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at')
    .order('created_at', { ascending: true })
    .limit(MAX_EXPORT_ROWS)

  if (action) query = query.eq('action', action)
  if (actorId) query = query.eq('actor_id', actorId)
  if (targetType) query = query.eq('target_type', targetType)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)

  const { data, error } = await query

  if (error) {
    console.error('[EXPORT-AUDIT-LOGS] Query failed:', error.message, { correlationId: ctx.correlationId })
    return apiError(500, 'Failed to export audit logs', { correlationId: ctx.correlationId })
  }

  const rows = data ?? []

  // Build CSV
  const csvHeader = 'id,actor_id,action,target_type,target_id,ip_address,user_agent,created_at,metadata'
  const csvRows = rows.map(r => [
    r.id,
    r.actor_id ?? '',
    escapeCsv(r.action),
    escapeCsv(r.target_type ?? ''),
    r.target_id ?? '',
    r.ip_address ?? '',
    escapeCsv(r.user_agent ?? ''),
    r.created_at,
    escapeCsv(JSON.stringify(r.metadata ?? {})),
  ].join(','))

  const csv = [csvHeader, ...csvRows].join('\n')

  return new Response(csv, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
      'X-Correlation-Id': ctx.correlationId,
      'X-Row-Count': String(rows.length),
      'X-Max-Rows': String(MAX_EXPORT_ROWS),
    },
  })
}))

/** Escape a value for CSV — wrap in quotes if it contains comma, quote, or newline */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
