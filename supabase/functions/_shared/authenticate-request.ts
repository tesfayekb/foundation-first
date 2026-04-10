/**
 * authenticateRequest — Server-side JWT validation and user context extraction.
 *
 * Owner: api module
 * Classification: security-critical
 * Fail behavior: fail-secure — throws 401
 * Lifecycle: active
 */
import { supabaseAdmin } from './supabase-admin.ts'
import { AuthError } from './errors.ts'

export interface AuthenticatedUser {
  id: string
  email: string | undefined
  lastSignInAt: string | undefined
}

export interface AuthenticatedContext {
  user: AuthenticatedUser
  token: string
  ipAddress: string | null
  userAgent: string | null
  correlationId: string
}

/**
 * Authenticate an incoming request.
 * Extracts and validates Bearer token, returns authenticated context.
 */
export async function authenticateRequest(req: Request): Promise<AuthenticatedContext> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing or malformed authorization header')
  }

  const token = authHeader.replace('Bearer ', '')

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    throw new AuthError('Invalid or expired token')
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      lastSignInAt: user.last_sign_in_at ?? undefined,
    },
    token,
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    userAgent: req.headers.get('user-agent'),
    correlationId: crypto.randomUUID(),
  }
}

// Re-export for convenience
export { AuthError } from './errors.ts'
