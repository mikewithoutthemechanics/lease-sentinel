-- Phase 1 completion: imported bank activity, distributions and finance jobs
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  amount DECIMAL(12, 2) NOT NULL,
  balance DECIMAL(12, 2),
  source TEXT NOT NULL DEFAULT 'csv',
  matched_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  matched_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'ignored')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (source, reference, transaction_date, amount)
);

CREATE TABLE IF NOT EXISTS owner_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  statement_id UUID REFERENCES owner_statements(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type TEXT NOT NULL CHECK (job_type IN ('recurring_invoices', 'arrears_reminders', 'owner_statements')),
  run_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'failed')),
  result JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS bank_transactions_status_date_idx ON bank_transactions(status, transaction_date);
CREATE INDEX IF NOT EXISTS owner_distributions_status_idx ON owner_distributions(status);

CREATE POLICY "Owners and managers can manage bank transactions" ON bank_transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));
CREATE POLICY "Owners and managers can manage distributions" ON owner_distributions FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));

-- Service-role scheduled jobs are intentionally not exposed through browser RLS.
CREATE OR REPLACE FUNCTION run_due_recurring_invoices()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE created_count INTEGER := 0;
BEGIN
  INSERT INTO invoices (lease_id, invoice_number, amount, vat_amount, due_date, status, description)
  SELECT rc.lease_id,
    'REC-' || to_char(current_date, 'YYYYMMDD') || '-' || substring(rc.id::text, 1, 8),
    rc.amount + (rc.amount * rc.vat_rate),
    rc.amount * rc.vat_rate,
    current_date, 'unpaid', rc.description
  FROM recurring_charges rc
  WHERE rc.active AND rc.next_run_date <= current_date
    AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.lease_id = rc.lease_id AND i.description = rc.description AND i.due_date = current_date);
  GET DIAGNOSTICS created_count = ROW_COUNT;
  UPDATE recurring_charges SET next_run_date = CASE frequency WHEN 'monthly' THEN next_run_date + interval '1 month' WHEN 'quarterly' THEN next_run_date + interval '3 months' ELSE next_run_date + interval '1 year' END WHERE active AND next_run_date <= current_date;
  RETURN created_count;
END; $$;
