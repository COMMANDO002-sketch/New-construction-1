# CLASPCONSTRUCTION Estate Portal — Blue Stone Estate

Architecture, payment flow, database structure and the CDA Notice Board
design for the tenant/landlord portal built on the CLASPCONSTRUCTION React site.

**Decisions locked in:** one estate (Blue Stone, Mowe-Ofada) · React/Vite
frontend + Node/Express/PostgreSQL backend · Paystack for payments ·
Termii for SMS push.

---

## 1. Architecture

```
┌──────────────────────────────┐        ┌──────────────────────────────┐
│  React + Vite frontend       │  JSON  │  Node/Express API  :4000     │
│  /portal  (tenant + admin)   │ ─────► │  /api/*                      │
│  localhost:5173              │ ◄───── │  JWT auth, role checks       │
└──────────────────────────────┘        └───────┬───────────┬──────────┘
                                                │           │
                                      PostgreSQL│           │HTTPS
                                      (Neon /   │           │
                                       Supabase │           ▼
                                       /local)  │   ┌────────────────┐
                                                │   │ Paystack API   │
                                                │   │ initialize /   │
                                                ▼   │ verify / webhook│
                                          ┌──────────┐ └────────────────┘
                                          │ payments │
                                          │ notices  │──► Termii SMS (now)
                                          │ receipts │──► WhatsApp (phase 2)
                                          └──────────┘
```

Run the API with `npm run dev` from `server/` (see `server/README.md`).

---

## 2. Paystack setup (start here — you don't have an account yet)

1. Go to **paystack.com/register** and sign up with your business email.
2. Verify the email, then open **Dashboard → Settings → Business** and
   complete the profile:
   - Business type (e.g. Business Name / Sole Proprietor)
   - CAC certificate **or** a government ID if you don't have CAC yet
   - Nigerian bank account + account number (for settlement)
   - Phone number and address
3. While verification is pending you already have **test keys** under
   **Settings → API Keys & Webhooks**:
   - `sk_test_...` (secret — goes in `server/.env` only, never in the
     frontend, never in git)
   - `pk_test_...` (publishable — safe for the browser)
4. Test cards (from Paystack docs):
   - Success: `4084 0840 8408 4081`, any future expiry, CVV `408`, PIN `0000`
     (OTP `123456` in test mode)
   - Insufficient funds: `4084 0840 8408 4082`
5. **Webhook:** in production set
   `https://your-domain.com/api/webhooks/paystack` in the dashboard. For
   local development use a tunnel: `ngrok http 4000` and paste the HTTPS URL.
6. When verification completes, swap in the `sk_live_` / `pk_live_` keys —
   that's the only change needed; money then settles to your bank account
   (T+1 business days standard).

> Paystack charges 1.5% + ₦100 locally, waived for local transactions
> during the first few months of a new account — check your dashboard for
> the current offer. Rent is large enough that the CDA may prefer bank
> transfer + admin confirmation (already built in, see §4).

---

## 3. Database structure (PostgreSQL — `server/db/schema.sql`)

| Table | Purpose |
|---|---|
| `users` | Every account. Roles: `tenant`, `landlord`, `cda_admin`, `super_admin`. Phone is the login + SMS target. |
| `houses` | Block + house number, linked landlord & tenant, yearly `rent_amount`. |
| `bill_types` | Waste / Security / Water / Electricity Levy pricing, editable by admin (`is_active` soft-delete keeps history). |
| `payments` | **One unified ledger** for rent and bills: amount (₦), status (`pending → success/failed/abandoned`), Paystack reference, receipt number `BS/2026/000123`, channel (card/transfer/ussd/cash). |
| `notices` | CDA Notice Board items: type (`meeting`, `dues`, `event`, `alert`, `general`), title, body, agenda, event date, venue, draft/published flag. |
| `notice_deliveries` | Per-tenant push status (SMS now, WhatsApp later): `queued/sent/failed/skipped`. |
| `notice_reads` | Read receipts — who opened each notice and when. |
| `complaints` + `complaint_replies` | Maintenance tickets with status `open → in_progress → resolved` and a two-way message thread. |
| `counters` | Sequences for receipt numbers. |
| `v_rent_status` | View joining occupied houses with their last successful rent payment — powers the defaulters list. |

**Money convention:** amounts are stored in Naira (`NUMERIC(12,2)`); the
API multiplies by 100 when talking to Paystack (kobo).

**Period convention:** rent payments carry `period = '2026'` (the rent
year), bills carry `period = '2026-10'` (the month). The defaulters
report checks rent for the year you select.

---

## 4. Payment flow (Paystack)

1. Tenant opens **Pay Rent** or **Pay Bills** → `POST /api/payments/initialize`.
   The **amount is resolved on the server** from `houses.rent_amount` or
   `bill_types.amount` — a manipulated browser cannot change what is charged.
2. API stores a `pending` row with a unique `reference`, calls Paystack
   `/transaction/initialize`, returns `authorizationUrl`.
3. Frontend redirects the tenant there → they pick **Card / Transfer / USSD
   / Bank Deposit** on Paystack's hosted page (PCI handled for you).
4. Paystack redirects back to `/portal/payments/callback?reference=...`.
   The frontend calls `GET /api/payments/verify?reference=...`.
5. The API asks **Paystack's own servers** (never trusts the URL) and, on
   `status: success`, marks the payment successful, issues the receipt
   number and sends the SMS receipt.
6. Independently, Paystack fires `charge.success` to
   `/api/webhooks/paystack`. The handler verifies the
   `x-paystack-signature` (HMAC-SHA512 of the raw body), then credits the
   payment **idempotently** — if the browser callback already credited it,
   the webhook is a no-op. Both paths can race safely.

Offline payments (cash / direct transfer / POS) are recorded by admin via
`POST /api/admin/payments` — same ledger, same receipt sequence, channel
marked `cash`/`bank_transfer`.

---

## 5. CDA Notice Board design

**Admin side (CDA console)**
- Compose: type (meeting/dues/event/alert/general), title, body, plus
  meeting-specific fields — **date & time, venue, agenda**.
- Save as **draft** (only admins see it) or **publish**.
- On publish, every active tenant gets a delivery row and an SMS push:

  ```
  CLASPTEK CDA NOTICE: Town Hall Meeting — October Dues on
  25 Oct 2026 at 5:00 PM at Estate Hall A. Agenda: road repairs,
  security levies. Read full notice on the tenant portal.
  ```
- Per-notice **stats**: audience size, SMS sent/failed/skipped, **reads**
  — so the CDA can see who actually saw the meeting announcement and
  follow up on the rest.
- Push never blocks publishing: SMS failures are recorded per tenant and
  the notice is still live in the portal.

**Tenant side (portal)**
- Feed sorted so **unread notices float to the top**, with type badge,
  date/venue chips and the agenda rendered as a list.
- Opening a notice records a read receipt (`notice_reads`).
- Unread count shows on the dashboard bell.

**Channels**
- **Now:** Termii SMS (cheapest reliable Nigerian transactional SMS,
  ~₦2–4/SMS, supports sender ID). Set `TERMII_API_KEY` — until then
  deliveries are marked `skipped` and the notice simply appears in-app.
- **Phase 2:** WhatsApp via Meta Cloud API — requires business verification
  and an approved message template (see comments in
  `server/src/services/notify.js`). Recommended only for high-value
  announcements because template approval takes days.

---

## 6. Roles & permissions

| Capability | Tenant | Landlord | CDA Admin | Super Admin |
|---|:-:|:-:|:-:|:-:|
| View own profile / dues / receipts | ✅ | ✅ | ✅ | ✅ |
| Pay rent & bills (Paystack) | ✅ | ✅ | ✅ | ✅ |
| Read notice board | ✅ | ✅ | ✅ | ✅ |
| File complaints, reply | ✅ | ✅ | ✅ | ✅ |
| Post / publish notices, see stats | — | — | ✅ | ✅ |
| Confirm offline payments, edit bill pricing | — | — | ✅ | ✅ |
| Manage houses, tenants, landlord links | — | — | ✅ | ✅ |
| Defaulters list + Excel reports | — | — | ✅ | ✅ |
| Create admin accounts | — | — | — | ✅* |

\* `requireRole` always lets `super_admin` through.

Tenants self-register with phone + password; **an admin links the house
number** so nobody can claim a house that isn't theirs.

---

## 7. API reference

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Tenant signs up |
| POST | `/api/auth/login` | public | Phone/email + password → JWT |
| GET | `/api/auth/me` | auth | Current user |
| POST | `/api/auth/change-password` | auth | Change password |
| GET | `/api/me` | auth | Profile: house, block, landlord, unread notices |
| GET | `/api/me/dues` | auth | Rent + bills standing right now |
| GET | `/api/me/payments` | auth | Payment history |
| GET | `/api/me/payments/:id` | auth | Receipt detail |
| GET | `/api/bills` | auth | Active bill pricing |
| POST/PATCH/DELETE | `/api/bills…` | CDA | Manage bill pricing |
| POST | `/api/payments/initialize` | auth | Start Paystack checkout |
| GET | `/api/payments/verify?reference=` | auth | Verify + issue receipt |
| GET | `/api/payments/methods` | auth | Card/transfer/USSD options |
| POST | `/api/webhooks/paystack` | Paystack | Signed webhook (raw body) |
| GET | `/api/notices` | auth | Tenant notice feed |
| GET/POST/PATCH/DELETE | `/api/notices…` | CDA | Manage notices |
| POST | `/api/notices/:id/publish` | CDA | Publish + SMS push to all |
| GET | `/api/notices/:id/stats` | CDA | Delivery + read report |
| POST | `/api/complaints` | auth | File a ticket |
| GET | `/api/complaints/mine` | auth | Own tickets |
| GET/PATCH | `/api/complaints…` | CDA | Triage tickets |
| GET | `/api/admin/stats` | CDA | Dashboard numbers |
| GET/POST/PATCH | `/api/admin/houses…` | CDA | Houses, tenants, rent, occupancy |
| GET/POST/PATCH | `/api/admin/users…` | CDA | Accounts |
| GET/POST | `/api/admin/payments…` | CDA | Ledger + confirm/record offline payment |
| GET | `/api/admin/defaulters?year=` | CDA | Who owes rent |
| GET | `/api/reports/payments.xlsx?year=` | CDA | Excel ledger |
| GET | `/api/reports/defaulters.xlsx?year=` | CDA | Excel defaulters |

---

## 8. Frontend (built — `src/portal/`)

`react-router-dom` was added: the public site stays at `/`, the portal lives
under `/portal` (header link: “Tenant Portal”).

| Route | Screen |
|---|---|
| `/portal/login` | Sign in / create account (phone + password) |
| `/portal` | Dashboard: house & landlord, dues, unread notices, latest notices |
| `/portal/pay` | Pay Rent / Pay Bills → Paystack hosted checkout |
| `/portal/payments/callback` | Verifies the reference server-side, shows printable receipt |
| `/portal/notices` | CDA notice board — unread first, agenda, read receipts |
| `/portal/history` | Payment history + printable receipts |
| `/portal/complaints` | File tickets, follow the reply thread |
| `/portal/admin` | CDA console: overview stats, notice composer (publish + SMS), payment ledger + offline recording, defaulters & Excel reports, houses/tenants, bill pricing, complaint triage |

Shared pieces: `api.js` (JWT fetch wrapper + authenticated Excel downloads),
`auth.jsx` / `auth-context.js` (AuthProvider, roles), `ui.jsx` (receipt,
status pills, modal), `portal.css` (black-and-gold design system matching the
public site). The API base URL comes from `VITE_API_URL` (defaults to
`http://localhost:4000/api` — see the root `.env.example`).

## 9. Deployment checklist

- [ ] Postgres provisioned (Neon/Supabase free tier is fine) → `DATABASE_URL`, `PGSSL=true`
- [ ] `JWT_SECRET` = long random string, API deployed (Render/Railway/VPS)
- [ ] `CORS_ORIGIN` = your live site URL(s)
- [ ] Paystack **live** keys set, webhook URL saved in Paystack dashboard
- [ ] `npm run db:migrate && npm run seed` run once against production
- [ ] Termii API key + sender ID configured, SMS budget funded
- [ ] HTTPS everywhere (Paystack webhook signature verification requires it)
- [ ] SPA rewrite so deep links work on static hosts: send `/portal/*` to
      `index.html` (Netlify: `/* /index.html 200` · Vercel: rewrite to
      `/index.html` · nginx: `try_files $uri /index.html;`)
- [ ] `.env` never committed (server/.gitignore already excludes it)
