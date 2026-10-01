-- Phase 2: Maintenance command centre
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('plumbing', 'electrical', 'hvac', 'security', 'appliance', 'structural', 'general'));
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('emergency', 'high', 'normal', 'low'));
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS tenant_rating INTEGER CHECK (tenant_rating BETWEEN 1 AND 5);

CREATE TABLE IF NOT EXISTS maintenance_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'shortlisted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preventative_maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  frequency_months INTEGER NOT NULL CHECK (frequency_months > 0),
  next_due_date DATE NOT NULL,
  contractor_id UUID REFERENCES profiles(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE maintenance_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventative_maintenance ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS maintenance_queue_idx ON maintenance_requests(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS maintenance_quote_request_idx ON maintenance_quotes(request_id, status);

CREATE POLICY "Property teams can manage maintenance quotes" ON maintenance_quotes FOR ALL
 USING (EXISTS (SELECT 1 FROM maintenance_requests r JOIN units u ON u.id = r.unit_id JOIN properties p ON p.id = u.property_id WHERE r.id = request_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id OR auth.uid() = contractor_id)))
 WITH CHECK (EXISTS (SELECT 1 FROM maintenance_requests r JOIN units u ON u.id = r.unit_id JOIN properties p ON p.id = u.property_id WHERE r.id = request_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id OR auth.uid() = contractor_id)));
CREATE POLICY "Property teams can manage maintenance comments" ON maintenance_comments FOR ALL
 USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM maintenance_requests r JOIN units u ON u.id = r.unit_id JOIN properties p ON p.id = u.property_id WHERE r.id = request_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
 WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Owners and managers can manage preventative maintenance" ON preventative_maintenance FOR ALL
 USING (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)))
 WITH CHECK (EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND (auth.uid() = p.owner_id OR auth.uid() = p.manager_id)));
