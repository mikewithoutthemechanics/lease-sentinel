export type UserRole = 'landlord' | 'tenant' | 'manager' | 'contractor' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  manager_id?: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  created_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_number: string;
  rent_amount: number;
  is_occupied: boolean;
  created_at: string;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  signed_lease_url?: string;
  signature_hash?: string;
  status: 'active' | 'expired' | 'terminated';
  created_at: string;
}

export interface Invoice {
  id: string;
  lease_id: string;
  invoice_number: string;
  amount: number;
  vat_amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'overdue';
  description?: string;
  created_at: string;
}

export type ExpenseCategory = 'rates' | 'utilities' | 'insurance' | 'maintenance' | 'management' | 'bond' | 'other';

export interface Expense {
  id: string;
  property_id: string;
  unit_id?: string;
  category: ExpenseCategory;
  description: string;
  supplier?: string;
  amount: number;
  vat_amount: number;
  expense_date: string;
  status: 'unpaid' | 'scheduled' | 'paid' | 'reimbursed';
  receipt_url?: string;
  created_by?: string;
  created_at: string;
}

export interface OwnerStatement {
  id: string;
  property_id: string;
  period_start: string;
  period_end: string;
  income: number;
  expenses: number;
  owner_amount: number;
  status: 'draft' | 'approved' | 'sent';
  statement_url?: string;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  tenant_id: string;
  contractor_id?: string;
  description: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'verified';
  photo_url?: string;
  created_at: string;
}
