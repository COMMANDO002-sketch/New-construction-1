-- =====================================================================
-- CLASPCONSTRUCTION Estate Portal — Blue Stone Estate, Mowe-Ofada, Ogun State
-- PostgreSQL 14+   |   Single-estate model (extendable later)
-- Apply with:  npm run db:migrate
-- The script is idempotent — safe to run more than once.
-- Money is stored in Naira (NUMERIC(12,2)); Paystack sends kobo and the
-- API layer converts. All timestamps follow Africa/Lagos server time.
-- =====================================================================

-- 1. USERS & ROLES -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  role          TEXT NOT NULL DEFAULT 'tenant'
                CHECK (role IN ('tenant', 'landlord', 'cda_admin', 'super_admin')),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  phone         TEXT NOT NULL UNIQUE,          -- 234XXXXXXXXXX, used for SMS/WhatsApp
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. HOUSES ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS houses (
  id          BIGSERIAL PRIMARY KEY,
  block       TEXT NOT NULL,                   -- e.g. 'A'
  house_no    TEXT NOT NULL,                   -- e.g. '12'
  house_type  TEXT,                            -- e.g. '4 Bedroom Duplex'
  landlord_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  tenant_id   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  rent_amount NUMERIC(12,2) NOT NULL DEFAULT 0, -- yearly rent in Naira
  is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block, house_no)
);
CREATE INDEX IF NOT EXISTS idx_houses_tenant ON houses (tenant_id);

-- 3. BILL PRICING (managed by admin/CDA) -------------------------------
CREATE TABLE IF NOT EXISTS bill_types (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,            -- Waste, Security, Water, Electricity Levy
  description TEXT,
  amount      NUMERIC(12,2) NOT NULL,          -- price in Naira
  frequency   TEXT NOT NULL DEFAULT 'monthly'
              CHECK (frequency IN ('monthly', 'quarterly', 'annual', 'one_off')),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. PAYMENTS (rent + bills, one unified ledger) -----------------------
CREATE TABLE IF NOT EXISTS payments (
  id                   BIGSERIAL PRIMARY KEY,
  user_id              BIGINT NOT NULL REFERENCES users(id),
  house_id             BIGINT REFERENCES houses(id),
  category             TEXT NOT NULL CHECK (category IN ('rent', 'bill')),
  bill_type_id         BIGINT REFERENCES bill_types(id) ON DELETE SET NULL,
  description          TEXT NOT NULL,          -- '2026 Rent', 'Security Levy — Oct 2026'
  period               TEXT,                   -- rent: '2026' | bill: '2026-10'
  amount               NUMERIC(12,2) NOT NULL, -- Naira
  currency             TEXT NOT NULL DEFAULT 'NGN',
  status               TEXT NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'success', 'failed', 'abandoned', 'refunded')),
  channel              TEXT,                   -- card | transfer | ussd | bank | cash
  paystack_reference   TEXT UNIQUE,
  paystack_access_code TEXT,
  receipt_no           TEXT UNIQUE,            -- BS/2026/000123
  paid_at              TIMESTAMPTZ,
  confirmed_by         BIGINT REFERENCES users(id), -- admin manual confirmation
  confirmed_at         TIMESTAMPTZ,
  meta                 JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (category <> 'bill' OR bill_type_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments (user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_ref          ON payments (paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_cat_period   ON payments (category, period, status);
CREATE INDEX IF NOT EXISTS idx_payments_house        ON payments (house_id, category, status);

-- 5. CDA NOTICE BOARD ---------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
  id           BIGSERIAL PRIMARY KEY,
  type         TEXT NOT NULL DEFAULT 'general'
               CHECK (type IN ('meeting', 'dues', 'event', 'alert', 'general')),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  agenda       TEXT,                           -- meeting agenda (newline separated)
  event_at     TIMESTAMPTZ,                    -- meeting/event date + time
  venue        TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at   TIMESTAMPTZ,
  created_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices (is_published, publish_at DESC);

-- Outbound push status per tenant (SMS now, WhatsApp later)
CREATE TABLE IF NOT EXISTS notice_deliveries (
  id         BIGSERIAL PRIMARY KEY,
  notice_id  BIGINT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp', 'email')),
  status     TEXT NOT NULL DEFAULT 'queued'
             CHECK (status IN ('queued', 'sent', 'failed', 'skipped')),
  error      TEXT,
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notice_id, user_id, channel)
);
CREATE INDEX IF NOT EXISTS idx_deliveries_notice ON notice_deliveries (notice_id, status);

-- Read receipts (who opened the notice in the portal)
CREATE TABLE IF NOT EXISTS notice_reads (
  notice_id BIGINT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (notice_id, user_id)
);

-- 6. COMPLAINTS / MAINTENANCE ------------------------------------------
CREATE TABLE IF NOT EXISTS complaints (
  id          BIGSERIAL PRIMARY KEY,
  tenant_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  house_id    BIGINT REFERENCES houses(id),
  category    TEXT NOT NULL DEFAULT 'other'
              CHECK (category IN ('plumbing', 'electrical', 'security', 'waste', 'structural', 'other')),
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
              CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);

CREATE TABLE IF NOT EXISTS complaint_replies (
  id          BIGSERIAL PRIMARY KEY,
  complaint_id BIGINT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. COUNTERS (sequential receipt numbers) -----------------------------
CREATE TABLE IF NOT EXISTS counters (
  name  TEXT PRIMARY KEY,
  value BIGINT NOT NULL DEFAULT 0
);
INSERT INTO counters (name, value) VALUES ('receipt', 0) ON CONFLICT DO NOTHING;

-- 8. VIEWS --------------------------------------------------------------
-- Rent standing per occupied house (feeds the defaulters list)
CREATE OR REPLACE VIEW v_rent_status AS
SELECT
  h.id          AS house_id,
  h.block,
  h.house_no,
  h.rent_amount,
  h.is_occupied,
  t.id          AS tenant_id,
  t.full_name   AS tenant_name,
  t.phone       AS tenant_phone,
  l.full_name   AS landlord_name,
  l.phone       AS landlord_phone,
  (SELECT MAX(p.paid_at) FROM payments p
    WHERE p.house_id = h.id AND p.category = 'rent' AND p.status = 'success')
                AS last_rent_paid_at,
  (SELECT p.period FROM payments p
    WHERE p.house_id = h.id AND p.category = 'rent' AND p.status = 'success'
    ORDER BY p.paid_at DESC LIMIT 1)
                AS last_rent_period,
  (SELECT p.receipt_no FROM payments p
    WHERE p.house_id = h.id AND p.category = 'rent' AND p.status = 'success'
    ORDER BY p.paid_at DESC LIMIT 1)
                AS last_rent_receipt
FROM houses h
LEFT JOIN users t ON t.id = h.tenant_id
LEFT JOIN users l ON l.id = h.landlord_id;
