/**
 * Smoke test: boots the API in-process, checks /api/health, confirms auth is
 * enforced, that unknown routes 404 as JSON, and that unsigned Paystack
 * webhooks are rejected. Needs no database connection.
 * Run with:  npm run smoke
 */

// Config is read from process.env at import time, so defaults are set first.
process.env.PORT = process.env.PORT || '4997'
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://localhost:5432/smoke_test'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret-0123456789'

const port = Number(process.env.PORT)
const base = `http://localhost:${port}/api`
const results = []

function check(name, ok, detail = '') {
  results.push({ name, ok: Boolean(ok), detail })
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  // Import boots the server (app.listen runs at module load).
  await import('../index.js')

  let up = false
  for (let attempt = 0; attempt < 50 && !up; attempt++) {
    await wait(100)
    try {
      up = (await fetch(`${base}/health`)).ok
    } catch {
      /* still starting */
    }
  }
  check('server started', up)
  if (!up) return

  const health = await (await fetch(`${base}/health`)).json()
  check('GET /api/health responds', health.ok === true)

  const noAuth = await fetch(`${base}/me`)
  check('protected route rejects missing token (401)', noAuth.status === 401)

  // With a live DATABASE_URL this returns 401; without one it may 500 at the
  // DB layer — either way the endpoint must exist.
  const badLogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: '08000000000', password: 'wrong-password' }),
  })
  check('login endpoint reachable', badLogin.status !== 404, `status ${badLogin.status}`)

  const missing = await fetch(`${base}/does-not-exist`)
  const missingBody = await missing.json().catch(() => null)
  check('unknown route returns JSON 404', missing.status === 404 && Boolean(missingBody?.error))

  const webhookNoSig = await fetch(`${base}/webhooks/paystack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'charge.success' }),
  })
  check('webhook rejects unsigned payload (401)', webhookNoSig.status === 401)

  const invalidBody = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'A', phone: '', password: 'short' }),
  })
  check('validation returns 400 on bad input', invalidBody.status === 400, `status ${invalidBody.status}`)
}

main()
  .catch((error) => check('smoke run', false, error.message))
  .finally(() => {
    let failed = 0
    for (const result of results) {
      console.log(
        `${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? ` — ${result.detail}` : ''}`,
      )
      if (!result.ok) failed++
    }
    console.log(failed === 0 ? '\nAll smoke tests passed.' : `\n${failed} smoke test(s) failed.`)
    // Immediate exit: the in-process listen handle would otherwise keep the
    // event loop (and this script) alive forever.
    process.exit(failed === 0 ? 0 : 1)
  })
