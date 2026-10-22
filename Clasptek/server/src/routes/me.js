import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { httpError } from '../lib/validate.js'

const router = Router()
router.use(requireAuth)

/**
 * GET /api/me — tenant profile: house, block, landlord, unread notices.
 * This is what the portal dashboard header renders.
 */
router.get('/', async (req, res) => {
  const [profile, dues, unread] = await Promise.all([
    query(
      `SELECT u.id, u.role, u.full_name, u.email, u.phone,
              h.id AS house_id, h.block, h.house_no, h.house_type, h.rent_amount,
              l.full_name AS landlord_name, l.phone AS landlord_phone
         FROM users u
         LEFT JOIN houses h ON h.tenant_id = u.id
         LEFT JOIN users l  ON l.id = h.landlord_id
        WHERE u.id = $1`,
      [req.user.id],
    ),
    currentDues(req.user.id),
    query(
      `SELECT COUNT(*)::int AS count
         FROM notices n
        WHERE n.is_published = TRUE
          AND n.publish_at <= now()
          AND NOT EXISTS (
            SELECT 1 FROM notice_reads r
             WHERE r.notice_id = n.id AND r.user_id = $1)`,
      [req.user.id],
    ),
  ])

  res.json({ profile: profile.rows[0], dues, unreadNotices: unread.rows[0].count })
})

/**
 * Rent + bills currently standing for this tenant.
 * Rent counts as paid when a successful payment exists for this calendar
 * year; each monthly bill counts as paid for the current YYYY-MM period.
 */
async function currentDues(userId) {
  const year = new Date().getFullYear()
  const month = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const [rent, bills] = await Promise.all([
    query(
      `SELECT h.rent_amount AS amount,
              EXISTS (
                SELECT 1 FROM payments p
                 WHERE p.user_id = $1 AND p.category = 'rent' AND p.status = 'success'
                   AND p.period = $2::text
              ) AS paid,
              (SELECT p.receipt_no FROM payments p
                WHERE p.user_id = $1 AND p.category = 'rent' AND p.status = 'success'
                  AND p.period = $2::text
                ORDER BY p.paid_at DESC LIMIT 1) AS receipt_no
         FROM houses h WHERE h.tenant_id = $1`,
      [userId, String(year)],
    ),
    query(
      `SELECT b.id, b.name, b.amount, b.frequency,
              EXISTS (
                SELECT 1 FROM payments p
                 WHERE p.user_id = $1 AND p.category = 'bill' AND p.status = 'success'
                   AND p.bill_type_id = b.id AND p.period = $3
              ) AS paid
         FROM bill_types b
        WHERE b.is_active = TRUE AND b.frequency = 'monthly'
        ORDER BY b.name`,
      [userId, String(year), month],
    ),
  ])

  const house = rent.rows[0]
  const items = []

  if (house) {
    items.push({
      kind: 'rent',
      name: `${year} Rent`,
      amount: Number(house.amount),
      paid: house.paid,
      receiptNo: house.receipt_no,
    })
  }
  for (const bill of bills.rows) {
    items.push({
      kind: 'bill',
      billTypeId: bill.id,
      name: bill.name,
      amount: Number(bill.amount),
      paid: bill.paid,
      period: month,
    })
  }
  return items
}

/** GET /api/me/dues — what I owe right now. */
router.get('/dues', async (req, res) => {
  res.json({ items: await currentDues(req.user.id) })
})

/** GET /api/me/payments — full payment history, newest first. */
router.get('/payments', async (req, res) => {
  const { rows } = await query(
    `SELECT id, category, description, period, amount, status, channel,
            receipt_no, paid_at, created_at
       FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 200`,
    [req.user.id],
  )
  res.json({ payments: rows })
})

/** GET /api/me/payments/:id — receipt detail for the receipt screen. */
router.get('/payments/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, h.block, h.house_no, u.full_name AS payer_name, u.phone AS payer_phone
       FROM payments p
       LEFT JOIN houses h ON h.id = p.house_id
       JOIN users u ON u.id = p.user_id
      WHERE p.id = $1 AND p.user_id = $2`,
    [req.params.id, req.user.id],
  )
  if (!rows[0]) throw httpError(404, 'Payment not found')
  res.json({ payment: rows[0] })
})

export default router
