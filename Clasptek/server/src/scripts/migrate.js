import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import 'dotenv/config'
import pg from 'pg'

const here = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(here, '..', '..', 'db', 'schema.sql')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing — copy .env.example to .env first.')
  process.exit(1)
}

const sql = fs.readFileSync(schemaPath, 'utf8')
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

try {
  await client.connect()
  await client.query(sql)
  console.log('Schema applied — tables and views are up to date.')
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
