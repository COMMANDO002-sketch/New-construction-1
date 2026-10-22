import 'dotenv/config'
import bcrypt from 'bcryptjs'
import pg from 'pg'

/**
 * Seed the essentials:
 *  1. The first CDA/super admin account (from ADMIN_* env vars).
 *  2. The default Blue Stone bill types — amounts are placeholders the CDA
 *     can edit from the admin dashboard at any time.
 * Run after `npm run db:migrate`:  npm run seed
 */

const DEFAULT_BILLS = [
  { name: 'Waste', description: 'Monthly waste management levy', amount: 2000, frequency: 'monthly' },
  { name: 'Security', description: 'Monthly security service levy', amount: 5000, frequency: 'monthly' },
  { name: 'Water', description: 'Monthly water supply levy', amount: 3000, frequency: 'monthly' },
  { name: 'Electricity Levy', description: 'Monthly estate electricity levy', amount: 2500, frequency: 'monthly' },
]

const ADMIN_NAME = process.env.ADMIN_NAME || 'CDA Administrator'
const ADMIN_PHONE = process.env.ADMIN_PHONE
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || null

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing — copy .env.example to .env first.')
  process.exit(1)
}
if (!ADMIN_PHONE || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_PHONE and ADMIN_PASSWORD in .env before seeding.')
  process.exit(1)
}

const digits = ADMIN_PHONE.replace(/\D/g, '')
const phone = digits.startsWith('234')
  ? digits
  : digits.startsWith('0')
    ? `234${digits.slice(1)}`
    : `234${digits}`

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

try {
  await client.connect()

  const existing = await client.query('SELECT id, role FROM users WHERE phone = $1', [phone])
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    await client.query(
      `INSERT INTO users (role, full_name, email, phone, password_hash)
       VALUES ('super_admin', $1, $2, $3, $4)`,
      [ADMIN_NAME, ADMIN_EMAIL, phone, hash],
    )
    console.log(`Admin account created: ${ADMIN_NAME} (${phone})`)
  } else {
    console.log(`Admin account already exists (${phone}) — left unchanged.`)
    if (existing.rows[0].role !== 'super_admin') {
      await client.query(`UPDATE users SET role = 'super_admin' WHERE id = $1`, [
        existing.rows[0].id,
      ])
      console.log('Promoted that account to super_admin.')
    }
  }

  for (const bill of DEFAULT_BILLS) {
    const result = await client.query(
      `INSERT INTO bill_types (name, description, amount, frequency)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO NOTHING
       RETURNING name`,
      [bill.name, bill.description, bill.amount, bill.frequency],
    )
    if (result.rows.length > 0) console.log(`Bill type created: ${bill.name}`)
  }

  console.log('Seed complete.')
} catch (error) {
  console.error('Seed failed:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
