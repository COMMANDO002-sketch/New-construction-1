import crypto from 'node:crypto'
import { env, paystackConfigured } from '../config.js'
import { httpError } from '../lib/validate.js'

const BASE_URL = 'https://api.paystack.co'

async function paystackFetch(path, options = {}) {
  if (!paystackConfigured()) {
    throw httpError(
      503,
      'Paystack is not configured yet. Add PAYSTACK_SECRET_KEY to server/.env (test key first).',
    )
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.status === false) {
    throw httpError(502, `Paystack: ${data.message || response.statusText}`)
  }
  return data.data
}

/**
 * Start a transaction. Returns { authorization_url, access_code, reference }.
 * The tenant is redirected to authorization_url (card / transfer / USSD),
 * then Paystack sends them back to APP_URL/portal/payments/callback.
 * `metadata` travels with the payment and comes back on the webhook so we
 * can reconcile without guessing.
 */
export function initializeTransaction({ email, amountNaira, reference, metadata = {} }) {
  return paystackFetch('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: Math.round(Number(amountNaira) * 100), // Paystack works in kobo
      currency: 'NGN',
      reference,
      callback_url: `${env.APP_URL}/portal/payments/callback`,
      metadata,
    }),
  })
}

/** Confirm the true final state of a transaction directly with Paystack. */
export function verifyTransaction(reference) {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`)
}

/**
 * Paystack sends `x-paystack-signature`: HMAC-SHA512 of the RAW body using
 * your secret key. Never trust a webhook without this check, and never
 * parse the body to JSON before verifying it.
 */
export function isValidWebhookSignature(rawBody, signature) {
  if (!signature || !paystackConfigured()) return false
  const expected = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(String(signature), 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/** Reference generated when we create the pending payment row. */
export function newReference() {
  const stamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomBytes(3).toString('hex').toUpperCase()
  return `BS-${stamp}-${random}`
}
