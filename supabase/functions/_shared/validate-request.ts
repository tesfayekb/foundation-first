/**
 * validateRequest — Zod-based strict input validation.
 *
 * Owner: api module
 * Classification: api-critical
 * Fail behavior: fail-fast — throws ValidationError (caller returns 400)
 * Lifecycle: active
 */
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { ValidationError } from './errors.ts'

export { z }

/**
 * Parse and validate request body against a Zod schema.
 * Throws ValidationError on failure.
 */
export function validateRequest<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): z.infer<T> {
  const result = schema.safeParse(body)
  if (!result.success) {
    const flattened = result.error.flatten()
    throw new ValidationError(flattened.fieldErrors, flattened.formErrors)
  }
  return result.data
}

// Re-export for convenience
export { ValidationError } from './errors.ts'
