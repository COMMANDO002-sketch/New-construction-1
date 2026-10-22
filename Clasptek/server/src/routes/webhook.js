import { Router } from 'express'
import { query } from '../db.js'
import { isValidWebhookSignature } from '../services/paystack.js'
import { creditPayment } from '../services/payments.js'

const router = Router()

/**
 * POST /api/webhooks/paystack
 *
 * Mounted with express.raw() BEFORE express.json() (see src/index.js) so the
 * signature can be checked against the untouched request body.
 * Always answer 200 for anything we have seen or do not understand, so
 * Paystack does not retry forever.
 */
router.post('/paystack', async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from('')
  const signature = req.headers['x-paystack-signature']

  if (!isValidWebhookSignature(raw, signature)) {
    console.warn('[webhook] rejected: invalid signature')
    return res.status(401).json({ received: false })
  }

  let event
  try {
    event = JSON.parse(raw.toString('utf8'))
  } catch {
    return res.status(400).json({ received: false, error: 'Invalid JSON' })
  }

  if (event.event === 'charge.success') {
    const { reference, channel } = event.data || {}
    const { rows } = await query('SELECT id, status FROM payments WHERE paystack_reference = $1', [
      reference,
    ])

    if (rows.length === 0) {
      console.warn(`[webhook] unknown reference: ${reference}`)
      return res.json({ received: true })
    }

    if (rows[0].status !== 'success') {
      const payment = await creditPayment(rows[0].id, { channel })
      console.log(
        `[webhook] credited payment #${payment?.id ?? rows[0].id} (${reference}) via ${channel}`,
      )
    }
  } else if (event.event === 'charge.failed') {
    const { reference } = event.data || {}
    await query(
      `UPDATE payments SET status = 'failed', updated_at = now()
        WHERE paystack_reference = $1 AND status = 'pending'`,
      [reference],
    )
  }

  res.json({ received: true })
})

export default router
