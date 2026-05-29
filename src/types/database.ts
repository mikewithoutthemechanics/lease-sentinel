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
