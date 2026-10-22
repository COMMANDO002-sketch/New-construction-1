import { smsConfigured } from '../config.js'
import { toInternationalNigerianNumber } from '../lib/validate.js'

const TERMII_URL = 'https://api.termii.com/api/sms'

/**
 * Send an SMS through Termii (https://console.termii.com → API keys).
 * Returns { skipped: true } when no key is configured so callers can mark
 * the delivery as 'skipped' instead of failing the request.
 */
export async function sendSms(phone, message) {
  if (!smsConfigured()) return { skipped: true }

  const response = await fetch(TERMII_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TERMII_API_KEY,
      to: toInternationalNigerianNumber(phone),
      from: process.env.TERMII_SENDER_ID || 'CLASPTEK',
      sms: message,
      type: 'plain',
      channel: 'generic',
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.status === 'error') {
    throw new Error(data.message || `Termii HTTP ${response.status}`)
  }
  return { sent: true, data }
}

/**
 * WhatsApp push — integration point for the future.
 *
 * To switch this on you need the Meta WhatsApp Cloud API:
 *   1. Create a Meta app → add the WhatsApp product.
 *   2. Verify your business (required before template messages work).
 *   3. Create and get approved a template, e.g. "cda_notice" with
 *      {{1}} = notice title, {{2}} = date/venue.
 *   4. POST to graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages with
 *      the approved template (free-form messages are only allowed within
 *      the 24-hour customer-service window).
 * Until then, notice delivery uses SMS via Termii.
 */
export async function sendWhatsApp(phone, message) {
  void phone
  void message
  return { skipped: true, reason: 'WhatsApp Cloud API not configured' }
}
