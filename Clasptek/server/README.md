# CLASPCONSTRUCTION Estate Portal API

Express + PostgreSQL backend for the Blue Stone Estate tenant portal:
authentication, rent & bill payments (Paystack), the CDA Notice Board with
SMS push, complaints and Excel reports.

Full design documentation: [`../docs/estate-portal.md`](../docs/estate-portal.md)

## Requirements

- Node.js 20+
- PostgreSQL 14+ (local, or a free tier from [Neon](https://neon.tech) /
  [Supabase](https://supabase.com))

## First-time setup

```powershell
# 1. Install dependencies
npm install

# 2. Configure the environment
Copy-Item .env.example .env
#    then edit .env: DATABASE_URL, JWT_SECRET, ADMIN_PHONE, ADMIN_PASSWORD

# 3. Create the tables
npm run db:migrate

# 4. Create the admin account + default bill types
npm run seed

# 5. Start the API (http://localhost:4000/api)
npm run dev
```

Other scripts:

```sh
npm run smoke   # boots the API in-process and checks health/auth/webhook rules
npm run lint    # oxlint
npm start       # production-style start (no file watching)
```

## Key environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PGSSL` | `true` for hosted databases |
| `JWT_SECRET` | long random string — signs login tokens |
| `APP_URL` | frontend origin — Paystack redirects tenants back here |
| `CORS_ORIGIN` | comma-separated list of allowed frontend origins |
| `PAYSTACK_SECRET_KEY` | `sk_test_...` first, `sk_live_...` when approved — server only |
| `PAYSTACK_PUBLIC_KEY` | `pk_test_...` / `pk_live_...` (returned to the frontend) |
| `TERMII_API_KEY` | enables SMS receipts + notice push (optional to start) |
| `ADMIN_PHONE` / `ADMIN_PASSWORD` | first `super_admin` created by `npm run seed` |

Never commit `.env` — it is already excluded by `.gitignore`.

## Day-to-day

- **Paystack test mode:** use test keys and Paystack's test cards; when your
  account is approved, swap in live keys and set the webhook URL
  (`https://domain/api/webhooks/paystack`) in the Paystack dashboard.
  Local webhook testing: `ngrok http 4000`.
- **Admin login:** the phone number + password from `.env` (seeded account).
- **Add houses:** `POST /api/admin/houses`, then link tenants with
  `PATCH /api/admin/houses/:id`.
- **Reports:** `/api/reports/payments.xlsx` and
  `/api/reports/defaulters.xlsx` download Excel workbooks.
