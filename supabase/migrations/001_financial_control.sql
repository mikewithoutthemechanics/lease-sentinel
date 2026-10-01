-- Phase 1: financial control foundation
-- Run after supabase/schema.sql. VAT is configurable per charge: residential rent is
-- commonly VAT-exempt while a VAT-registered commercial landlord may charge VAT.

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('rates', 'utilities', 'insurance', 'maintenance', 'management', 'bond', 'other')),
  description TEXT NOT NULL,
  supplier TEXT,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  vat_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (vat_amount >= 0),
  expense_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'scheduled', 'paid', 'reimbursed')),
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (payment_id, invoice_id)
);

CREATE TABLE IF NOT EXISTS recurring_charges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id UUID NOT NULL REFERENCES leases(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  vat_rate DECIMAL(5, 4) NOT NULL DEFAULT 0 CHECK (vat_rate >= 0 AND vat_rate <= 1),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
  next_run_date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS owner_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  income DECIMAL(12, 2) NOT NULL DEFAULT 0,
  expenses DECIMAL(12, 2) NOT NULL DEFAULT 0,
  owner_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent')),
  statement_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (property_id, period_start, period_end)
);

-- Prevent duplicate Payfast notifications from creating duplicate payments.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_reference TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_reference_idx
  ON payments(provider, raw_reference)
  WHERE provider IS NOT NULL AND raw_reference IS NOT NULL;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_statements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS invoices_status_due_date_idx ON invoices(status, due_date);
CREATE INDEX IF NOT EXISTS expenses_property_date_idx ON expenses(property_id, expense_date);
CREATE INDEX IF NOT EXISTS recurring_charges_next_run_idx ON recurring_charges(next_run_date) WHERE active = TRUE;

-- These policies follow the existing owner/manager access model. In production,
-- replace the repeated joins with an organisation membership table.
CREATE POLICY "Owners and managers can manage property expenses" ON expenses FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));

CREATE POLICY "Owners and managers can view statements" ON owner_statements FOR ALL
  USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));
