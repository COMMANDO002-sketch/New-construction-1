import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { httpError, parse } from '../lib/validate.js'

const router = Router()
router.use(requireAuth)

const complaintSchema = z.object({
  category: z.enum(['plumbing', 'electrical', 'security', 'waste', 'structural', 'other']).default('other'),
  subject: z.string().min(3, 'Subject is too short').max(160),
  body: z.string().min(5, 'Describe the problem').max(4000),
})

/** POST /api/complaints — tenant files a maintenance/complaint ticket. */
router.post('/', async (req, res) => {
  const input = parse(complaintSchema, req.body)
  const { rows: houseRows } = await query('SELECT id FROM houses WHERE tenant_id = $1', [
    req.user.id,
  ])

  const { rows } = await query(
    `INSERT INTO complaints (tenant_id, house_id, category, subject, body)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [req.user.id, houseRows[0]?.id ?? null, input.category, input.subject.trim(), input.body.trim()],
  )
  res.status(201).json({ complaint: rows[0] })
})

/** GET /api/complaints/mine — the tenant's own tickets with replies. */
router.get('/mine', async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, h.block, h.house_no
       FROM complaints c
       LEFT JOIN houses h ON h.id = c.house_id
      WHERE c.tenant_id = $1
      ORDER BY c.created_at DESC`,
    [req.user.id],
  )
  res.json({ complaints: rows })
})

/** GET /api/complaints — admin: every ticket, filterable by status. */
router.get('/', requireRole('cda_admin'), async (req, res) => {
  const status = req.query.status
  const params = [req.user.id]
  let where = 'TRUE'
  if (status) {
    params.push(status)
    where = `c.status = $2`
  }

  const { rows } = await query(
    `SELECT c.*, h.block, h.house_no, u.full_name AS tenant_name, u.phone AS tenant_phone,
            a.full_name AS assigned_name
       FROM complaints c
       LEFT JOIN houses h ON h.id = c.house_id
       JOIN users u ON u.id = c.tenant_id
       LEFT JOIN users a ON a.id = c.assigned_to
      WHERE ${where}
      ORDER BY CASE c.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
               c.created_at DESC`,
    params,
  )
  void req.user
  res.json({ complaints: rows })
})

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  assignedTo: z.coerce.number().int().positive().optional(),
})

/** PATCH /api/complaints/:id — admin updates status/assignee. */
router.patch('/:id', requireRole('cda_admin'), async (req, res) => {
  const input = parse(statusSchema, req.body)
  const { rows } = await query(
    `UPDATE complaints
        SET status = $2,
            assigned_to = COALESCE($3, assigned_to),
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [req.params.id, input.status, input.assignedTo ?? null],
  )
  if (!rows[0]) throw httpError(404, 'Complaint not found')
  res.json({ complaint: rows[0] })
})

const replySchema = z.object({ body: z.string().min(1, 'Write a reply').max(4000) })

/** POST /api/complaints/:id/replies — both the tenant and admin can reply. */
router.post('/:id/replies', async (req, res) => {
  const input = parse(replySchema, req.body)

  const { rows: complaintRows } = await query('SELECT id, tenant_id FROM complaints WHERE id = $1', [
    req.params.id,
  ])
  const complaint = complaintRows[0]
  if (!complaint) throw httpError(404, 'Complaint not found')

  const isOwner = complaint.tenant_id === req.user.id
  const isAdmin = req.user.role === 'cda_admin' || req.user.role === 'super_admin'
  if (!isOwner && !isAdmin) throw httpError(403, 'Not your ticket')

  const { rows } = await query(
    `INSERT INTO complaint_replies (complaint_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [req.params.id, req.user.id, input.body.trim()],
  )
  res.status(201).json({ reply: rows[0] })
})

/** GET /api/complaints/:id/replies */
router.get('/:id/replies', async (req, res) => {
  const { rows: complaintRows } = await query('SELECT id, tenant_id FROM complaints WHERE id = $1', [
    req.params.id,
  ])
  const complaint = complaintRows[0]
  if (!complaint) throw httpError(404, 'Complaint not found')

  const isOwner = complaint.tenant_id === req.user.id
  const isAdmin = req.user.role === 'cda_admin' || req.user.role === 'super_admin'
  if (!isOwner && !isAdmin) throw httpError(403, 'Not your ticket')

  const { rows } = await query(
    `SELECT r.id, r.body, r.created_at, u.full_name, u.role
       FROM complaint_replies r
       JOIN users u ON u.id = r.user_id
      WHERE r.complaint_id = $1
      ORDER BY r.created_at ASC`,
    [req.params.id],
  )
  res.json({ replies: rows })
})

export default router
