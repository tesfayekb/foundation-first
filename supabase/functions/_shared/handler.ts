/**
 * Edge function request handler — unified pipeline wrapper.
 */
import { corsHeaders } from './cors.ts'
import { apiError } from './api-error.ts'
import { AuthError, PermissionDeniedError, ValidationError } from './errors.ts'

type HandlerFn = (req: Request) => Promise<Response>

/**
 * Wraps an edge function handler with CORS + error classification.
 */
export function createHandler(handler: HandlerFn): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      return await handler(req)
    } catch (err) {
      if (err instanceof AuthError) {
        return apiError(401, err.message)
      }
      if (err instanceof ValidationError) {
        return apiError(400, err.message, {
          code: 'VALIDATION_ERROR',
          field: Object.keys(err.fieldErrors)[0],
        })
      }
      if (err instanceof PermissionDeniedError) {
        return apiError(403, 'Permission denied')
      }

      console.error('[HANDLER] Unhandled error:', err)
      return apiError(500, 'Internal server error')
    }
  }
}

/** Build a success JSON response with CORS headers */
export function apiSuccess(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
