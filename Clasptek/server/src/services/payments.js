import { query } from '../db.js'
import { formatAmount } from '../lib/validate.js'
import { sendSms } from './notify.js'

/** Next sequential receipt number: BS/2026/000123. */
async function nextReceiptNo() {
  const { rows } = await query(
    `UPDATE counters SET value = value + 1
      WHERE name = 'receipt'
      RETURNING value`,
  )
  return `BS/${new Date().getFullYear()}/${String(rows[0].value).padStart(6, '0')}`
}

/**
 * Mark a payment as successful and issue its receipt.
 *
 * Idempotent by design: the verify endpoint AND the Paystack webhook can
 * both call this for the same payment (webhooks race with browser
 * callbacks), but only the first call wins — the WHERE clause re-checks the
 * status inside the database. Returns null when the payment was already
 * credited.
 */
export async function creditPayment(paymentId, { channel = null } = {}) {
  const receiptNo = await nextReceiptNo()

  const { rows } = await query(
    `UPDATE payments
        SET status      = 'success',
            channel     = COALESCE($2, channel),
            receipt_no  = COALESCE(receipt_no, $3),
            paid_at     = COALESCE(paid_at, now()),
            updated_at  = now()
      WHERE id = $1 AND status <> 'success'
      RETURNING *`,
    [paymentId, channel, receiptNo],
  )

  if (rows.length === 0) return null

  const payment = rows[0]

  // SMS receipt — best effort, never blocks the payment flow.
  try {
    const { rows: userRows } = await query('SELECT phone, full_name FROM users WHERE id = $1', [
      payment.user_id,
    ])
    const user = userRows[0]
    if (user) {
      await sendSms(
        user.phone,
        `CLASPCONSTRUCTION: We received your payment of N${formatAmount(payment.amount)} for ${payment.description}. Receipt ${payment.receipt_no}. Thank you.`,
      )
    }
  } catch (error) {
    console.error('[receipt sms] failed:', error.message)
  }

  return payment
}
