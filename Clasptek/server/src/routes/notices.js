import { Router } from 'express'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { httpError, parse } from '../lib/validate.js'
import { sendSms } from '../services/notify.js'

const router = Router()
router.use(requireAuth)

const noticeSchema = z.object({
  type: z.enum(['meeting', 'dues', 'event', 'alert', 'general']).default('general'),
  title: z.string().min(3, 'Title is too short').max(160),
  body: z.string().min(3, 'Write the notice content').max(5000),
  agenda: z.string().max(4000).optional().or(z.literal('')),
  eventAt: z.string().datetime({ offset: true }).optional().or(z.literal('')),
  venue: z.string().max(200).optional().or(z.literal('')),
  publish: z.boolean().default(false),
  notify: z.boolean().default(true), // send SMS push to every tenant on publish
})

/**
 * GET /api/notices — the tenant-facing CDA Notice Board feed.
 * Unread notices float to the top so a fresh meeting announcement is seen
 * first. Each item carries `read` for the read-receipt dot.
 */
router.get('/', async (req, res) => {
  const { rows } = await query(
    `SELECT n.id, n.type, n.title, n.body, n.agenda, n.event_at, n.venue,
            n.is_published, n.publish_at, n.created_at,
            u.full_name AS posted_by,
            EXISTS (SELECT 1 FROM notice_reads r
                     WHERE r.notice_id = n.id AND r.user_id = $1) AS read
       FROM notices n
       LEFT JOIN users u ON u.id = n.created_by
      WHERE n.is_published = TRUE AND n.publish_at <= now()
      ORDER BY (EXISTS (SELECT 1 FROM notice_reads r
                         WHERE r.notice_id = n.id AND r.user_id = $1)) ASC,
               COALESCE(n.event_at, n.publish_at) DESC, n.publish_at DESC
      LIMIT 200`,
    [req.user.id],
  )
  res.json({ notices: rows })
})

/** GET /api/notices/:id — single notice; marks it read for this user. */
router.get('/:id', async (req, res) => {
  const { rows } = await query(
    `SELECT n.*, u.full_name AS posted_by,
            EXISTS (SELECT 1 FROM notice_reads r
                     WHERE r.notice_id = n.id AND r.user_id = $1) AS read
       FROM notices n
       LEFT JOIN users u ON u.id = n.created_by
      WHERE n.id = $2 AND n.is_published = TRUE`,
    [req.user.id, req.params.id],
  )
  if (!rows[0]) throw httpError(404, 'Notice not found')

  await query(
    `INSERT INTO notice_reads (notice_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id],
  )
  res.json({ notice: rows[0] })
})

/** POST /api/notices — admin/CDA posts a notice (draft or published). */
router.post('/', requireRole('cda_admin'), async (req, res) => {
  const input = parse(noticeSchema, req.body)

  const { rows } = await query(
    `INSERT INTO notices
       (type, title, body, agenda, event_at, venue, is_published, publish_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $7 THEN now() END, $8)
     RETURNING *`,
    [
      input.type,
      input.title.trim(),
      input.body.trim(),
      input.agenda || null,
      input.eventAt || null,
      input.venue || null,
      input.publish,
      req.user.id,
    ],
  )
  const notice = rows[0]

  let delivery = null
  if (input.publish && input.notify) delivery = await pushToTenants(notice)

  res.status(201).json({ notice, delivery })
})

/** PATCH /api/notices/:id — admin edits a notice. */
router.patch('/:id', requireRole('cda_admin'), async (req, res) => {
  const input = parse(noticeSchema.partial().omit({ publish: true, notify: true }), req.body)
  const { rows: existing } = await query('SELECT * FROM notices WHERE id = $1', [req.params.id])
  if (!existing[0]) throw httpError(404, 'Notice not found')

  const merged = { ...existing[0], ...input }
  const { rows } = await query(
    `UPDATE notices
        SET type = $2, title = $3, body = $4, agenda = $5, event_at = $6, venue = $7,
            updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [
      req.params.id,
      merged.type,
      merged.title.trim(),
      merged.body.trim(),
      merged.agenda || null,
      merged.eventAt || merged.event_at || null,
      merged.venue || null,
    ],
  )
  res.json({ notice: rows[0] })
})

/**
 * POST /api/notices/:id/publish
 * Publishes a draft and pushes it to every active tenant — SMS through
 * Termii now, WhatsApp Cloud API later (see services/notify.js).
 * Push failures never block publishing: the notice is live in the portal
 * regardless, and each delivery row records what happened.
 */
router.post('/:id/publish', requireRole('cda_admin'), async (req, res) => {
  const { rows } = await query(
    `UPDATE notices
        SET is_published = TRUE, publish_at = COALESCE(publish_at, now()), updated_at = now()
      WHERE id = $1
      RETURNING *`,
    [req.params.id],
  )
  if (!rows[0]) throw httpError(404, 'Notice not found')

  const shouldNotify = req.body?.notify !== false
  const delivery = shouldNotify ? await pushToTenants(rows[0]) : null
  res.json({ notice: rows[0], delivery })
})

/** POST /api/notices/:id/read — tenant taps "I've seen this". */
router.post('/:id/read', async (req, res) => {
  const { rowCount } = await query(
    `INSERT INTO notice_reads (notice_id, user_id) VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [req.params.id, req.user.id],
  )
  res.json({ ok: true, newlyRead: rowCount > 0 })
})

/** DELETE /api/notices/:id */
router.delete('/:id', requireRole('cda_admin'), async (req, res) => {
  const { rowCount } = await query('DELETE FROM notices WHERE id = $1', [req.params.id])
  if (rowCount === 0) throw httpError(404, 'Notice not found')
  res.json({ ok: true })
})

// ---------------------------------------------------------------------
// Admin views
// ---------------------------------------------------------------------

/** GET /api/notices/admin/all — drafts + published, for the CDA console. */
router.get('/admin/all', requireRole('cda_admin'), async (_req, res) => {
  const { rows } = await query(
    `SELECT n.*, u.full_name AS posted_by,
            (SELECT COUNT(*)::int FROM notice_reads r WHERE r.notice_id = n.id) AS reads,
            (SELECT COUNT(*)::int FROM users WHERE is_active = TRUE) AS audience
       FROM notices n
       LEFT JOIN users u ON u.id = n.created_by
      ORDER BY n.created_at DESC`,
  )
  res.json({ notices: rows })
})

/** GET /api/notices/:id/stats — delivery + read report for one notice. */
router.get('/:id/stats', requireRole('cda_admin'), async (req, res) => {
  const [totals, byChannel] = await Promise.all([
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM users WHERE is_active = TRUE) AS audience,
         (SELECT COUNT(*)::int FROM notice_reads WHERE notice_id = $1) AS reads,
         (SELECT COUNT(*)::int FROM notice_deliveries
           WHERE notice_id = $1 AND status = 'sent') AS sent,
         (SELECT COUNT(*)::int FROM notice_deliveries
           WHERE notice_id = $1 AND status = 'failed') AS failed,
         (SELECT COUNT(*)::int FROM notice_deliveries
           WHERE notice_id = $1 AND status = 'skipped') AS skipped`,
      [req.params.id],
    ),
    query(
      `SELECT channel, status, COUNT(*)::int AS count
         FROM notice_deliveries
        WHERE notice_id = $1
        GROUP BY channel, status
        ORDER BY channel, status`,
      [req.params.id],
    ),
  ])
  res.json({ totals: totals.rows[0], channels: byChannel.rows })
})

// ---------------------------------------------------------------------
// Delivery helper
// ---------------------------------------------------------------------

async function pushToTenants(notice) {
  const { rows: tenants } = await query(
    `SELECT id, phone, full_name FROM users WHERE role = 'tenant' AND is_active = TRUE`,
  )

  const when = notice.event_at
    ? ` on ${new Date(notice.event_at).toLocaleString('en-NG', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Africa/Lagos',
      })}`
    : ''
  const place = notice.venue ? ` at ${notice.venue}` : ''
  const message =
    `CLASPCONSTRUCTION CDA NOTICE: ${notice.title}${when}${place}. ` +
    `${notice.body.slice(0, 120)}${notice.body.length > 120 ? '…' : ''} ` +
    `Read full notice on the tenant portal.`

  const results = await Promise.allSettled(
    tenants.map(async (tenant) => {
      try {
        const outcome = await sendSms(tenant.phone, message)
        await query(
          `INSERT INTO notice_deliveries (notice_id, user_id, channel, status, sent_at, error)
           VALUES ($1, $2, 'sms', $3, CASE WHEN $3 = 'sent' THEN now() END, $4)
           ON CONFLICT (notice_id, user_id, channel) DO UPDATE
             SET status = EXCLUDED.status, sent_at = EXCLUDED.sent_at, error = EXCLUDED.error`,
          [
            notice.id,
            tenant.id,
            outcome.skipped ? 'skipped' : 'sent',
            outcome.skipped ? 'SMS not configured' : null,
          ],
        )
      } catch (error) {
        await query(
          `INSERT INTO notice_deliveries (notice_id, user_id, channel, status, error)
           VALUES ($1, $2, 'sms', 'failed', $3)
           ON CONFLICT (notice_id, user_id, channel) DO UPDATE
             SET status = 'failed', error = EXCLUDED.error`,
          [notice.id, tenant.id, error.message],
        )
      }
    }),
  )

  const summary = { audience: tenants.length, sent: 0, failed: 0, skipped: 0 }
  const { rows } = await query(
    `SELECT status, COUNT(*)::int AS count FROM notice_deliveries
      WHERE notice_id = $1 GROUP BY status`,
    [notice.id],
  )
  for (const row of rows) summary[row.status] = row.count
  void results
  return summary
}

export default router
