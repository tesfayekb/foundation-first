/**
 * safe-redirect — Validates redirect targets to prevent open redirect attacks.
 *
 * Only allows relative paths starting with `/` (but not `//`).
 * Rejects protocols, hostnames, and any other external URL pattern.
 */

const DEFAULT_FALLBACK = '/';

/**
 * Returns a safe internal path. If the target is external or malformed,
 * returns the fallback (default: '/').
 */
export function safeRedirectPath(target: unknown, fallback: string = DEFAULT_FALLBACK): string {
  if (typeof target !== 'string' || target.length === 0) {
    return fallback;
  }

  // Block protocol-relative URLs (//evil.com) and any protocol (http:, javascript:, etc.)
  if (
    target.startsWith('//') ||
    /^[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(target)
  ) {
    return fallback;
  }

  // Must start with /
  if (!target.startsWith('/')) {
    return fallback;
  }

  // Additional safety: try URL constructor — if it parses as having a different origin, reject
  try {
    const parsed = new URL(target, 'http://localhost');
    if (parsed.hostname !== 'localhost') {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return target;
}
