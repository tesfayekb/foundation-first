/**
 * RBAC Client Helpers — UX-only, NOT enforcement
 *
 * All real authorization is enforced server-side via:
 * - has_permission() SQL security definer
 * - RLS policies
 * - Privileged edge functions
 *
 * These helpers are for UI convenience only (hiding/showing elements).
 */

export interface AuthorizationContext {
  roles: string[];
  permissions: string[];
  is_superadmin: boolean;
}

/**
 * Check if a permission exists in the cached authorization context.
 * UX-only — does NOT enforce access. Server-side enforcement is authoritative.
 */
export function checkPermission(
  context: AuthorizationContext | null,
  permission: string
): boolean {
  if (!context) return false;
  if (context.is_superadmin) return true;
  return context.permissions.includes(permission);
}

/**
 * Check if a role exists in the cached authorization context.
 * UX-only — reserved for narrowly approved base-role gating (e.g., admin panel access).
 */
export function checkRole(
  context: AuthorizationContext | null,
  role: string
): boolean {
  if (!context) return false;
  return context.roles.includes(role);
}
