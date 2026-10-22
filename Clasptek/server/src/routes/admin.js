import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { httpError, parse, toInternationalNigerianNumber } from '../lib/validate.js'
import { creditPayment } from '../services/payments.js'

const router = Router()
router.use(requireAuth, requireRole('cda_admin'))

/** GET /api/admin/stats — headline numbers for the CDA dashboard. */
router.get('/stats', async (_req, res) => {
  const [houses, money, notices, complaints] = await Promise.all([
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE is_occupied)::int AS occupied,
              COUNT(*) FILTER (WHERE tenant_id IS NOT NULL)::int AS tenanted
         FROM houses`,
    ),
    query(
      `SELECT
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'success' AND date_trunc('month', paid_at) = date_trunc('month', now())
         ), 0)::numeric AS collected_this_month,
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'success' AND date_trunc('year', paid_at) = date_trunc('year', now())
         ), 0)::numeric AS collected_this_year,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE status = 'success')::int AS successful
       FROM payments`,
    ),
    query(`SELECT COUNT(*) FILTER (WHERE is_published)::int AS published FROM notices`),
    query(
      `SELECT COUNT(*) FILTER (WHERE status = 'open')::int AS open,
              COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress
         FROM complaints`,
    ),
  ])

  res.json({
    houses: houses.rows[0],
    money: money.rows[0],
    notices: notices.rows[0],
    complaints: complaints.rows[0],
  })
})

// ---------------------------------------------------------------------
// Houses
// ---------------------------------------------------------------------

/** GET /api/admin/houses — full occupancy list with tenant + landlord. */
router.get('/houses', async (_req, res) => {
  const { rows } = await query(
    `SELECT h.*, t.full_name AS tenant_name, t.phone AS tenant_phone,
            l.full_name AS landlord_name, l.phone AS landlord_phone
       FROM houses h
       LEFT JOIN users t ON t.id = h.tenant_id
       LEFT JOIN users l ON l.id = h.landlord_id
      ORDER BY h.block, h.house_no::int`,
  )
  res.json({ houses: rows })
})

const houseSchema = z.object({
  block: z.string().min(1).max(10),
  houseNo: z.string().min(1).max(20),
  houseType: z.string().max(80).optional().or(z.literal('')),
  landlordId: z.coerce.number().int().positive().optional(),
  rentAmount: z.coerce.number().min(0).default(0),
})

/** POST /api/admin/houses */
router.post('/houses', async (req, res) => {
  const input = parse(houseSchema, req.body)
  const { rows } = await query(
    `INSERT INTO houses (block, house_no, house_type, landlord_id, rent_amount)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.block.toUpperCase(), input.houseNo, input.houseType || null, input.landlordId ?? null, input.rentAmount],
  )
  res.status(201).json({ house: rows[0] })
})

const assignSchema = z.object({
  tenantId: z.coerce.number().int().positive().nullable().optional(),
  landlordId: z.coerce.number().int().positive().nullable().optional(),
  rentAmount: z.coerce.number().min(0).optional(),
  isOccupied: z.boolean().optional(),
})

/** PATCH /api/admin/houses/:id — link/unlink a tenant, set rent, mark occupancy. */
router.patch('/houses/:id', async (req, res) => {
  const input = parse(assignSchema, req.body)
  const { rows: existing } = await query('SELECT * FROM houses WHERE id = $1', [req.params.id])
  if (!existing[0]) throw httpError(404, 'House not found')
  const house = { ...existing[0], ...input }

  if (input.tenantId) {
    const { rows: other } = await query(
      'SELECT id FROM houses WHERE tenant_id = $1 AND id <> $2',
      [input.tenantId, req.params.id],
    )
    if (other.length > 0) throw httpError(409, 'That tenant is already linked to another house')
  }

  const { rows } = await query(
    `UPDATE houses
        SET tenant_id = $2, landlord_id = $3, rent_amount = $4, is_occupied = $5,
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      req.params.id,
      house.tenant_id ?? null,
      house.landlord_id ?? null,
      Number(house.rent_amount),
      house.is_occupied ?? house.tenant_id != null,
    ],
  )
  res.json({ house: rows[0] })
})

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------

/** GET /api/admin/users?role=tenant */
router.get('/users', async (req, res) => {
  const params = []
  let where = 'TRUE'
  if (req.query.role) {
    params.push(req.query.role)
    where = 'u.role = $1'
  }
  const { rows } = await query(
    `SELECT u.id, u.role, u.full_name, u.email, u.phone, u.is_active, u.created_at,
            h.block, h.house_no
       FROM users u
       LEFT JOIN houses h ON h.tenant_id = u.id
      WHERE ${where}
      ORDER BY u.created_at DESC`,
    params,
  )
  res.json({ users: rows })
})

const createUserSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['tenant', 'landlord', 'cda_admin']).default('tenant'),
})

/** POST /api/admin/users — CDA creates accounts directly (phone + password). */
router.post('/users', async (req, res) => {
  const input = parse(createUserSchema, req.body)
  const phone = toInternationalNigerianNumber(input.phone)

  const { rows: existing } = await query('SELECT id FROM users WHERE phone = $1', [phone])
  if (existing.length > 0) throw httpError(409, 'A user with this phone number already exists')

  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.default.hash(input.password, 10)
  const { rows } = await query(
    `INSERT INTO users (role, full_name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, role, full_name, email, phone, is_active, created_at`,
    [input.role, input.fullName.trim(), input.email || null, phone, hash],
  )
  res.status(201).json({ user: rows[0] })
})

/** PATCH /api/admin/users/:id — activate/deactivate or change role. */
router.patch('/users/:id', async (req, res) => {
  const input = parse(
    z.object({
      isActive: z.boolean().optional(),
      role: z.enum(['tenant', 'landlord', 'cda_admin', 'super_admin']).optional(),
    }),
    req.body,
  )
  const { rows } = await query(
    `UPDATE users
        SET is_active = COALESCE($2, is_active),
            role = COALESCE($3, role),
            updated_at = now()
      WHERE id = $1
      RETURNING id, role, full_name, phone, is_active`,
    [req.params.id, input.isActive ?? null, input.role ?? null],
  )
  if (!rows[0]) throw httpError(404, 'User not found')
  res.json({ user: rows[0] })
})

// ---------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------

/** GET /api/admin/payments?status=&category= — the money ledger. */
router.get('/payments', async (req, res) => {
  const params = []
  const filters = []
  if (req.query.status) {
    params.push(req.query.status)
    filters.push(`p.status = $${params.length}`)
  }
  if (req.query.category) {
    params.push(req.query.category)
    filters.push(`p.category = $${params.length}`)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''

  const { rows } = await query(
    `SELECT p.id, p.category, p.description, p.period, p.amount, p.status, p.channel,
            p.receipt_no, p.paid_at, p.confirmed_at, p.created_at, p.paystack_reference,
            u.full_name AS tenant_name, u.phone AS tenant_phone,
            h.block, h.house_no
       FROM payments p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN houses h ON h.id = p.house_id
       ${where}
      ORDER BY p.created_at DESC
      LIMIT 500`,
    params,
  )
  res.json({ payments: rows })
})

const manualConfirmSchema = z.object({
  channel: z.enum(['cash', 'bank_transfer', 'pos', 'other']).default('bank_transfer'),
  period: z.string().optional(),
  description: z.string().max(200).optional(),
})

/**
 * POST /api/admin/payments/:id/confirm
 * Confirms a payment made OUTSIDE the app (cash, direct transfer, POS) and
 * issues a receipt exactly like an online payment.
 */
router.post('/payments/:id/confirm', async (req, res) => {
  const input = parse(manualConfirmSchema, req.body)
  const { rows } = await query('SELECT * FROM payments WHERE id = $1', [req.params.id])
  const payment = rows[0]
  if (!payment) throw httpError(404, 'Payment not found')
  if (payment.status === 'success') return res.json({ payment, alreadyConfirmed: true })

  await query(
    `UPDATE payments
        SET description = COALESCE($2, description), period = COALESCE($3, period),
            confirmed_by = $4, confirmed_at = now(), updated_at = now()
      WHERE id = $1`,
    [payment.id, input.description || null, input.period || null, req.user.id],
  )

  const credited = await creditPayment(payment.id, { channel: input.channel })
  const { rows: fresh } = await query('SELECT * FROM payments WHERE id = $1', [payment.id])
  res.json({ payment: credited || fresh[0] })
})

/**
 * POST /api/admin/payments — record an offline (cash/transfer) payment
 * straight into the ledger, already confirmed, with a receipt number.
 */
router.post('/payments', async (req, res) => {
  const input = parse(
    z.object({
      userId: z.coerce.number().int().positive(),
      category: z.enum(['rent', 'bill']),
      billTypeId: z.coerce.number().int().positive().optional(),
      amount: z.coerce.number().positive('Amount must be positive'),
      period: z.string().optional(),
      description: z.string().max(200).optional(),
      channel: z.enum(['cash', 'bank_transfer', 'pos', 'other']).default('cash'),
    }),
    req.body,
  )

  const { rows: houseRows } = await query('SELECT id FROM houses WHERE tenant_id = $1', [
    input.userId,
  ])
  const now = new Date()
  const period =
    input.period || (input.category === 'rent' ? String(now.getFullYear()) : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

  let description = input.description
  if (!description && input.category === 'bill') {
    const { rows } = await query('SELECT name FROM bill_types WHERE id = $1', [input.billTypeId])
    if (!rows[0]) throw httpError(404, 'Bill type not found')
    description = `${rows[0].name} — ${period}`
  }
  if (!description && input.category === 'rent') description = `${period} Rent (offline payment)`

  const { rows } = await query(
    `INSERT INTO payments
       (user_id, house_id, category, bill_type_id, description, period, amount,
        status, channel, confirmed_by, confirmed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, now())
     RETURNING *`,
    [
      input.userId,
      houseRows[0]?.id ?? null,
      input.category,
      input.billTypeId ?? null,
      description,
      period,
      input.amount,
      input.channel,
      req.user.id,
    ],
  )

  const credited = await creditPayment(rows[0].id, { channel: input.channel })
  res.status(201).json({ payment: credited || rows[0] })
})

// ---------------------------------------------------------------------
// Defaulters
// ---------------------------------------------------------------------

/**
 * GET /api/admin/defaulters?year=2026
 * Occupied houses whose tenant has NO successful rent payment for the year.
 */
router.get('/defaulters', async (req, res) => {
  const year = String(req.query.year || new Date().getFullYear())
  const { rows } = await query(
    `SELECT v.house_id, v.block, v.house_no, v.rent_amount,
            v.tenant_id, v.tenant_name, v.tenant_phone,
            v.landlord_name, v.landlord_phone,
            v.last_rent_paid_at, v.last_rent_period, v.last_rent_receipt,
            (v.rent_amount)::numeric AS outstanding
       FROM v_rent_status v
      WHERE v.tenant_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM payments p
           WHERE p.house_id = v.house_id AND p.category = 'rent'
             AND p.status = 'success' AND p.period = $1
        )
      ORDER BY v.block, v.house_no::int`,
    [year],
  )
  res.json({ year, count: rows.length, defaulters: rows })
})

export default router
