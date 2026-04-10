/**
 * Shared error classes for edge function error classification.
 * These are pure classes with no external dependencies,
 * safe to import in any context including tests.
 */

/** Authentication failure — always results in 401 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/** Permission/authorization failure — always results in 403 */
export class PermissionDeniedError extends Error {
  permissionKey: string

  constructor(message: string, permissionKey: string) {
    super(message)
    this.name = 'PermissionDeniedError'
    this.permissionKey = permissionKey
  }
}

/** Input validation failure — always results in 400 */
export class ValidationError extends Error {
  fieldErrors: Record<string, string[] | undefined>
  formErrors: string[]

  constructor(
    fieldErrors: Record<string, string[] | undefined>,
    formErrors: string[]
  ) {
    const firstField = Object.keys(fieldErrors)[0]
    const firstMsg = firstField
      ? `${firstField}: ${fieldErrors[firstField]?.[0]}`
      : formErrors[0] ?? 'Validation failed'
    super(firstMsg)
    this.name = 'ValidationError'
    this.fieldErrors = fieldErrors
    this.formErrors = formErrors
  }
}
