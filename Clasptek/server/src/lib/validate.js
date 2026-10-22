/** Validate request data with a Zod schema, turning failures into HTTP 400s. */
export function parse(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
      .join('; ')
    const error = new Error(message)
    error.status = 400
    throw error
  }
  return result.data
}

/** Raise an error that the error handler will send with `status`. */
export function httpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

/**
 * Normalise a Nigerian phone number to 234XXXXXXXXXX (Termii/WhatsApp format).
 * Accepts 0803..., +234803..., 234803... and local separators.
 */
export function toInternationalNigerianNumber(input) {
  const digits = String(input).replace(/\D/g, '')
  if (digits.startsWith('234')) return digits
  if (digits.startsWith('0')) return `234${digits.slice(1)}`
  if (digits.length === 10) return `234${digits}`
  return digits
}

/** Receipt numbers look like BS/2026/000123. */
export function formatAmount(amount) {
  return Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
