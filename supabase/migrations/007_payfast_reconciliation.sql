-- Phase 4 (slice 1): Payfast sandbox authentication and two-way payment reconciliation.
-- Adds encrypted merchant credentials, a Payfast transaction ledger, webhook event
-- logging with retries, and sync run history shared by every future integration.

-- 1. Connection settings ------------------------------------------------------
ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live'));
ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS credentials JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS health_status TEXT NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'failing'));
ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE integration_connections ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP WITH TIME ZONE;
COMMENT ON COLUMN integration_connections.credentials IS 'AES-256-GCM encrypted secrets. Never readable by the browser: service-role access only.';

-- Secrets must never be served to the browser through the anon key.
REVOKE SELECT (credentials) ON integration_connections FROM anon, authenticated;

-- 2. Payment columns needed for provider reconciliation -----------------------
ALTER TABLE payments ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12, 2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'partially_refunded', 'failed'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- 3. Payfast transaction ledger (one row per pf_payment_id) -------------------
CREATE TABLE IF NOT EXISTS payfast_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pf_payment_id TEXT NOT NULL,
  m_payment_id TEXT,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'live')),
  payment_status TEXT NOT NULL,
  amount_gross DECIMAL(12, 2) NOT NULL DEFAULT 0,
  amount_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
  amount_net DECIMAL(12, 2) NOT NULL DEFAULT 0,
  refunded_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  source TEXT NOT NULL DEFAULT 'itn' CHECK (source IN ('itn', 'api', 'manual')),
  reconciliation_status TEXT NOT NULL DEFAULT 'unreconciled'
    CHECK (reconciliation_status IN ('unreconciled', 'matched', 'amount_mismatch', 'missing_locally', 'missing_at_payfast', 'unlinked', 'refunded')),
  reconciled_at TIMESTAMP WITH TIME ZONE,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (owner_id, pf_payment_id)
);

-- 4. Webhook event log with idempotency and retry bookkeeping -----------------
CREATE TABLE IF NOT EXISTS integration_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('payfast', 'xero', 'sage', 'whatsapp', 'google_calendar', 'bank_csv')),
  event_type TEXT NOT NULL DEFAULT 'notification',
  idempotency_key TEXT NOT NULL,
  external_id TEXT,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  source_verified BOOLEAN NOT NULL DEFAULT FALSE,
  source_ip TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'ignored', 'failed', 'rejected')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (provider, idempotency_key)
);

-- 5. Sync run history (health checks, reconciliation runs, future OAuth syncs) -
CREATE TABLE IF NOT EXISTS integration_sync_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'partial', 'failed')),
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS payfast_transactions_owner_idx ON payfast_transactions(owner_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS payfast_transactions_recon_idx ON payfast_transactions(owner_id, reconciliation_status);
CREATE INDEX IF NOT EXISTS webhook_events_status_idx ON integration_webhook_events(provider, status, created_at DESC);
CREATE INDEX IF NOT EXISTS webhook_events_retry_idx ON integration_webhook_events(next_retry_at) WHERE status = 'failed';
CREATE INDEX IF NOT EXISTS sync_runs_owner_idx ON integration_sync_runs(owner_id, provider, started_at DESC);

ALTER TABLE payfast_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view own payfast transactions" ON payfast_transactions;
CREATE POLICY "Owners view own payfast transactions" ON payfast_transactions FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners view own webhook events" ON integration_webhook_events;
CREATE POLICY "Owners view own webhook events" ON integration_webhook_events FOR SELECT USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Owners view own sync runs" ON integration_sync_runs;
CREATE POLICY "Owners view own sync runs" ON integration_sync_runs FOR SELECT USING (auth.uid() = owner_id);

-- Writes to these tables happen through the service role after signature
-- verification, so no INSERT/UPDATE policies are granted to end users.
