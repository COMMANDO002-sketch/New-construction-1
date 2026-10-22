import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { httpError, parse } from '../lib/validate.js'

const router = Router()

/** GET /api/bills — bill pricing shown on the "Pay Bills" screen.
 *  Admins may pass ?all=true to include archived (inactive) bill types. */
router.get('/', requireAuth, async (req, res) => {
  const wantAll =
    req.query.all === 'true' &&
    (req.user.role === 'cda_admin' || req.user.role === 'super_admin')

  const { rows } = await query(
    `SELECT id, name, description, amount, frequency, is_active
       FROM bill_types
      ${wantAll ? '' : 'WHERE is_active = TRUE'}
      ORDER BY name`,
  )
  res.json({ bills: rows })
})

const billSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(300).optional().or(z.literal('')),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
  frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_off']).default('monthly'),
  isActive: z.boolean().optional(),
})

/** POST /api/bills — admin/CDA creates a bill type. */
router.post('/', requireAuth, requireRole('cda_admin'), async (req, res) => {
  const input = parse(billSchema, req.body)
  const { rows } = await query(
    `INSERT INTO bill_types (name, description, amount, frequency)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.name.trim(), input.description || null, input.amount, input.frequency],
  )
  res.status(201).json({ bill: rows[0] })
})

/** PATCH /api/bills/:id — admin/CDA edits pricing or archives a bill. */
router.patch('/:id', requireAuth, requireRole('cda_admin'), async (req, res) => {
  const input = parse(billSchema.partial(), req.body)
  const { rows: existing } = await query('SELECT * FROM bill_types WHERE id = $1', [req.params.id])
  if (!existing[0]) throw httpError(404, 'Bill type not found')

  const merged = { ...existing[0], ...input }
  const { rows } = await query(
    `UPDATE bill_types
        SET name = $2, description = $3, amount = $4, frequency = $5,
            is_active = $6, updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      req.params.id,
      merged.name.trim(),
      merged.description || null,
      Number(merged.amount),
      merged.frequency,
      merged.isActive ?? merged.is_active,
    ],
  )
  res.json({ bill: rows[0] })
})

/** DELETE /api/bills/:id — soft delete: keeps payment history intact. */
router.delete('/:id', requireAuth, requireRole('cda_admin'), async (req, res) => {
  const { rowCount } = await query(
    'UPDATE bill_types SET is_active = FALSE, updated_at = now() WHERE id = $1',
    [req.params.id],
  )
  if (rowCount === 0) throw httpError(404, 'Bill type not found')
  res.json({ ok: true })
})

export default router
