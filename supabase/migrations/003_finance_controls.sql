-- Phase 1 hardening: reconciliation, statements, notifications and job retries
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  allocated_amount DECIMAL(12, 2) NOT NULL CHECK (allocated_amount > 0),
  match_type TEXT NOT NULL CHECK (match_type IN ('payment', 'expense')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reversed_at TIMESTAMP WITH TIME ZONE,
  CHECK ((payment_id IS NOT NULL AND expense_id IS NULL) OR (payment_id IS NULL AND expense_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS reconciliation_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('suggested', 'matched', 'unmatched', 'split', 'overpayment')),
  match_id UUID REFERENCES reconciliation_matches(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  actor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms')),
  template TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS reconciliation_matches_bank_idx ON reconciliation_matches(bank_transaction_id) WHERE reversed_at IS NULL;
CREATE INDEX IF NOT EXISTS reconciliation_audit_bank_idx ON reconciliation_audit(bank_transaction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notification_queue_due_idx ON notification_queue(status, scheduled_for);

CREATE POLICY "Owners and managers can manage reconciliation matches" ON reconciliation_matches FOR ALL
  USING (EXISTS (SELECT 1 FROM bank_transactions b JOIN properties p ON p.id = b.property_id WHERE b.id = bank_transaction_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM bank_transactions b JOIN properties p ON p.id = b.property_id WHERE b.id = bank_transaction_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));
CREATE POLICY "Owners and managers can view reconciliation audit" ON reconciliation_audit FOR SELECT
  USING (EXISTS (SELECT 1 FROM bank_transactions b JOIN properties p ON p.id = b.property_id WHERE b.id = bank_transaction_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));
CREATE POLICY "Users can queue their own notifications" ON notification_queue FOR INSERT
  WITH CHECK (auth.uid() = recipient_id);

ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE owner_statements ADD COLUMN IF NOT EXISTS owner_email TEXT;

-- Keep status consistent after a match is reversed or completely allocated.
CREATE OR REPLACE FUNCTION refresh_bank_transaction_status(target_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE line_amount NUMERIC; allocated NUMERIC;
BEGIN
  SELECT amount INTO line_amount FROM bank_transactions WHERE id = target_id;
  SELECT COALESCE(SUM(allocated_amount), 0) INTO allocated FROM reconciliation_matches WHERE bank_transaction_id = target_id AND reversed_at IS NULL;
  UPDATE bank_transactions SET status = CASE WHEN allocated = 0 THEN 'unmatched' WHEN allocated < ABS(line_amount) THEN 'unmatched' ELSE 'matched' END WHERE id = target_id;
END; $$;
