/**
 * query-audit-logs — Paginated audit log query endpoint.
 *
 * Permission: audit.view
 * Classification: privileged (read-only)
 * Audit: standard-risk (not audited — read-only)
 *
 * Allowed filters: action, actor_id, target_type, target_id, date_from, date_to
 * Sort: created_at DESC (fixed — no user-controlled sort)
 * Pagination: cursor-based via `before` (created_at of last item)
 * Max page size: 100
 */
import { createHandler, apiSuccess } from '../_shared/handler.ts'
import { authenticateRequest } from '../_shared/authenticate-request.ts'
import { checkPermissionOrThrow } from '../_shared/authorization.ts'
import { supabaseAdmin } from '../_shared/supabase-admin.ts'

const MAX_PAGE_SIZE = 100
const DEFAULT_PAGE_SIZE = 50

Deno.serve(createHandler(async (req: Request): Promise<Response> => {
  if (req.method !== 'GET') {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(405, 'Method not allowed')
  }

  const ctx = await authenticateRequest(req)
  await checkPermissionOrThrow(ctx.user.id, 'audit.view')

  const url = new URL(req.url)
  const params = url.searchParams

  // Parse & validate query params
  const limit = Math.min(
    Math.max(parseInt(params.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  )
  const action = params.get('action')?.trim() || null
  const actorId = params.get('actor_id')?.trim() || null
  const targetType = params.get('target_type')?.trim() || null
  const targetId = params.get('target_id')?.trim() || null
  const dateFrom = params.get('date_from')?.trim() || null
  const dateTo = params.get('date_to')?.trim() || null
  const before = params.get('before')?.trim() || null // cursor: created_at ISO string

  // Validate UUID format for ID fields
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (actorId && !uuidRegex.test(actorId)) {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(400, 'Invalid actor_id format', { code: 'VALIDATION_ERROR', field: 'actor_id', correlationId: ctx.correlationId })
  }
  if (targetId && !uuidRegex.test(targetId)) {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(400, 'Invalid target_id format', { code: 'VALIDATION_ERROR', field: 'target_id', correlationId: ctx.correlationId })
  }

  // Validate date formats
  if (dateFrom && isNaN(Date.parse(dateFrom))) {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(400, 'Invalid date_from format', { code: 'VALIDATION_ERROR', field: 'date_from', correlationId: ctx.correlationId })
  }
  if (dateTo && isNaN(Date.parse(dateTo))) {
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(400, 'Invalid date_to format', { code: 'VALIDATION_ERROR', field: 'date_to', correlationId: ctx.correlationId })
  }

  // Build query
  let query = supabaseAdmin
    .from('audit_logs')
    .select('id, actor_id, action, target_type, target_id, metadata, ip_address, user_agent, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (action) query = query.eq('action', action)
  if (actorId) query = query.eq('actor_id', actorId)
  if (targetType) query = query.eq('target_type', targetType)
  if (targetId) query = query.eq('target_id', targetId)
  if (dateFrom) query = query.gte('created_at', dateFrom)
  if (dateTo) query = query.lte('created_at', dateTo)
  if (before) query = query.lt('created_at', before)

  const { data, error } = await query

  if (error) {
    console.error('[QUERY-AUDIT-LOGS] Query failed:', error.message, { correlationId: ctx.correlationId })
    const { apiError } = await import('../_shared/api-error.ts')
    return apiError(500, 'Failed to query audit logs', { correlationId: ctx.correlationId })
  }

  const rows = data ?? []
  const nextCursor = rows.length === limit ? rows[rows.length - 1].created_at : null

  return apiSuccess({
    data: rows,
    pagination: {
      count: rows.length,
      limit,
      next_cursor: nextCursor,
    },
    correlation_id: ctx.correlationId,
  })
}))
