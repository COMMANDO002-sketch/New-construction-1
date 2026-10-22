import express from 'express'
import cors from 'cors'
import { env } from './config.js'
import authRoutes from './routes/auth.js'
import meRoutes from './routes/me.js'
import billRoutes from './routes/bills.js'
import paymentRoutes from './routes/payments.js'
import noticeRoutes from './routes/notices.js'
import complaintRoutes from './routes/complaints.js'
import adminRoutes from './routes/admin.js'
import reportRoutes from './routes/reports.js'
import webhookRoutes from './routes/webhook.js'

const app = express()

// Paystack webhooks need the RAW body for HMAC signature verification, so
// this route is registered before express.json().
app.use('/api/webhooks', webhookRoutes)

app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'claspconstruction-estate-portal', time: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/me', meRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notices', noticeRoutes)
app.use('/api/complaints', complaintRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportRoutes)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

// Express 5 forwards async errors here automatically.
app.use((error, _req, res, _next) => {
  const status = error.status || 500
  if (status >= 500) console.error(error)
  res.status(status).json({ error: error.message || 'Server error' })
})

app.listen(env.PORT, () => {
  console.log(`CLASPCONSTRUCTION Estate Portal API listening on http://localhost:${env.PORT}/api`)
})
