import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { query } from '../db.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { httpError, parse, toInternationalNigerianNumber } from '../lib/validate.js'

const router = Router()

const PUBLIC_USER = 'id, role, full_name, email, phone, is_active, created_at'

const registerSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name').max(120),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * POST /api/auth/register
 * Tenants self-register with phone + password. The house number is linked by
 * an admin (prevents anyone claiming a house that is not theirs).
 */
router.post('/register', async (req, res) => {
  const input = parse(registerSchema, req.body)
  const phone = toInternationalNigerianNumber(input.phone)
  const email = input.email ? input.email.toLowerCase() : null

  const { rows: existing } = await query('SELECT id FROM users WHERE phone = $1', [phone])
  if (existing.length > 0) throw httpError(409, 'An account with this phone number already exists')

  const passwordHash = await bcrypt.hash(input.password, 10)
  const { rows } = await query(
    `INSERT INTO users (role, full_name, email, phone, password_hash)
     VALUES ('tenant', $1, $2, $3, $4)
     RETURNING ${PUBLIC_USER}`,
    [input.fullName.trim(), email, phone, passwordHash],
  )

  const user = rows[0]
  res.status(201).json({ token: signToken(user), user })
})

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter your phone number or email'),
  password: z.string().min(1, 'Enter your password'),
})

/** POST /api/auth/login — phone number (0803...) or email both work. */
router.post('/login', async (req, res) => {
  const input = parse(loginSchema, req.body)
  const identifier = input.identifier.trim().toLowerCase()
  const phone = identifier.includes('@') ? identifier : toInternationalNigerianNumber(identifier)

  const { rows } = await query('SELECT * FROM users WHERE phone = $1 OR email = $2', [
    phone,
    identifier,
  ])
  const user = rows[0]

  const valid = user && (await bcrypt.compare(input.password, user.password_hash))
  if (!valid) throw httpError(401, 'Incorrect phone number/email or password')
  if (!user.is_active) throw httpError(403, 'This account has been deactivated — contact the CDA office')

  res.json({
    token: signToken(user),
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
    },
  })
})

/** GET /api/auth/me */
router.get('/me', requireAuth, async (req, res) => {
  const { rows } = await query(`SELECT ${PUBLIC_USER} FROM users WHERE id = $1`, [req.user.id])
  if (!rows[0]) throw httpError(404, 'Account not found')
  res.json({ user: rows[0] })
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

/** POST /api/auth/change-password */
router.post('/change-password', requireAuth, async (req, res) => {
  const input = parse(changePasswordSchema, req.body)
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])

  const valid = await bcrypt.compare(input.currentPassword, rows[0].password_hash)
  if (!valid) throw httpError(400, 'Current password is incorrect')

  const hash = await bcrypt.hash(input.newPassword, 10)
  await query('UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1', [
    req.user.id,
    hash,
  ])
  res.json({ ok: true })
})

export default router
