import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config.js'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { httpError, parse } from '../lib/validate.js'
import { initializeTransaction, newReference, verifyTransaction } from '../services/paystack.js'
import { creditPayment } from '../services/payments.js'

const router = Router()
router.use(requireAuth)

const initializeSchema = z
  .object({
    category: z.enum(['rent', 'bill']),
    billTypeId: z.coerce.number().int().positive().optional(),
    period: z
      .string()
      .regex(/^\d{4}(-\d{2})?$/, 'Use YYYY for rent or YYYY-MM for bills')
      .optional(),
  })
  .refine((value) => value.category !== 'bill' || value.billTypeId, {
    message: 'billTypeId is required when paying a bill',
    path: ['billTypeId'],
  })

/**
 * POST /api/payments/initialize
 * Resolves the amount server-side (never trust an amount from the browser),
 * stores a pending payment, and returns the Paystack checkout URL.
 */
router.post('/initialize', async (req, res) => {
  const input = parse(initializeSchema, req.body)
  const now = new Date()
  const defaultPeriod = input.category === 'rent' ? String(now.getFullYear()) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const period = input.period || defaultPeriod

  const { rows: houseRows } = await query(
    `SELECT h.id, h.rent_amount, h.block, h.house_no, h.tenant_id
       FROM houses h
       JOIN users u ON u.id = h.tenant_id
      WHERE h.tenant_id = $1`,
    [req.user.id],
  )
  const house = houseRows[0]

  if (input.category === 'rent' && !house) {
    throw httpError(400, 'No house is linked to your account yet — contact the CDA office.')
  }

  let amount
  let description
  let billTypeId = null

  if (input.category === 'rent') {
    amount = Number(house.rent_amount)
    description = `${period} Rent — Block ${house.block} House ${house.house_no}`
    if (amount <= 0) throw httpError(400, 'Rent amount has not been set for your house yet.')
  } else {
    const { rows } = await query('SELECT * FROM bill_types WHERE id = $1 AND is_active = TRUE', [
      input.billTypeId,
    ])
    const bill = rows[0]
    if (!bill) throw httpError(404, 'That bill type is not available')
    amount = Number(bill.amount)
    billTypeId = bill.id
    description = `${bill.name} — ${period}`
  }

  const reference = newReference()
  const { rows } = await query(
    `INSERT INTO payments
       (user_id, house_id, category, bill_type_id, description, period, amount,
        status, paystack_reference)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
     RETURNING *`,
    [
      req.user.id,
      house?.id ?? null,
      input.category,
      billTypeId,
      description,
      period,
      amount,
      reference,
    ],
  )
  const payment = rows[0]

  const { rows: userRows } = await query('SELECT email FROM users WHERE id = $1', [req.user.id])
  const checkout = await initializeTransaction({
    email: userRows[0].email || `tenant${req.user.id}@claspconstruction.local`,
    amountNaira: amount,
    reference,
    metadata: {
      payment_id: payment.id,
      category: input.category,
      bill_type_id: billTypeId,
      period,
      user_id: req.user.id,
      house_id: house?.id ?? null,
    },
  })

  res.json({
    paymentId: payment.id,
    reference,
    amount,
    description,
    authorizationUrl: checkout.authorization_url,
    publicKey: env.PAYSTACK_PUBLIC_KEY, // in case the frontend embeds Paystack Inline
  })
})

/**
 * GET /api/payments/verify?reference=BS-...
 * Called by the redirect/callback page after Paystack sends the tenant back.
 * Verification always goes to Paystack's API — the redirect URL alone proves
 * nothing, a user can edit it.
 */
router.get('/verify', async (req, res) => {
  const reference = String(req.query.reference || '')
  if (!reference) throw httpError(400, 'reference query parameter is required')

  const { rows } = await query('SELECT * FROM payments WHERE paystack_reference = $1', [reference])
  const payment = rows[0]
  if (!payment) throw httpError(404, 'Payment not found')
  if (payment.user_id !== req.user.id && req.user.role === 'tenant') {
    throw httpError(403, 'This payment does not belong to you')
  }

  if (payment.status === 'success') {
    return res.json({ status: 'success', payment }) // webhook already won the race
  }

  const verified = await verifyTransaction(reference)

  if (verified.status === 'success') {
    const credited = await creditPayment(payment.id, { channel: verified.channel })
    const { rows: fresh } = await query('SELECT * FROM payments WHERE id = $1', [payment.id])
    return res.json({ status: 'success', payment: credited || fresh[0] })
  }

  const nextStatus = verified.status === 'abandoned' ? 'abandoned' : 'failed'
  await query('UPDATE payments SET status = $2, updated_at = now() WHERE id = $1 AND status = $3', [
    payment.id,
    nextStatus,
    'pending',
  ])

  res.json({ status: verified.status, payment: { ...payment, status: nextStatus } })
})

/** GET /api/payments/methods — what tenants can pay with (display only). */
router.get('/methods', (_req, res) => {
  res.json({
    currency: 'NGN',
    methods: [
      { code: 'card', label: 'Debit / Credit Card' },
      { code: 'bank_transfer', label: 'Bank Transfer' },
      { code: 'ussd', label: 'USSD' },
      { code: 'bank', label: 'Bank Deposit' },
      { code: 'qr', label: 'QR Code' },
    ],
  })
})

export default router
