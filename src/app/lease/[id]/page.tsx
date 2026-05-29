import { createClient } from '@/lib/supabase/server'
import SigningPageClient from './SigningPageClient'
import { notFound } from 'next/navigation'

export default async function LeasePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lease, error } = await supabase
    .from('leases')
    .select(`
      *,
      units (
        unit_number,
        properties (
          owner_id,
          name,
          address
        )
      ),
      profiles (
        full_name
      )
    `)
    .eq('id', id)
    .single()

  if (error || !lease) {
    notFound()
  }

  const { data: landlord } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', lease.units.properties.owner_id)
    .single()

  const leaseData = {
    tenant_name: lease.profiles.full_name,
    landlord_name: landlord?.full_name || 'Landlord',
    property_address: `${lease.units.properties.name}, ${lease.units.properties.address}, Unit ${lease.units.unit_number}`,
    rent_amount: lease.rent_amount,
    start_date: lease.start_date,
    end_date: lease.end_date,
  }

  return <SigningPageClient leaseId={id} leaseData={leaseData} />
}
