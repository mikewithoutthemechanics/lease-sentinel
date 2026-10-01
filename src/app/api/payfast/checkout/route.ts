import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getConnection, payfastCredentialsFrom } from '@/lib/integrations/connections'
import { buildPayfastCheckout } from '@/lib/payments/payfast'

export const dynamic = 'force-dynamic'

/** Returns the signed Payfast form fields a tenant posts to pay an invoice. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { invoiceId } = await request.json() as { invoiceId?: string }
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })

  let admin
  try { admin = createAdminClient() } catch { return NextResponse.json({ error: 'Payments are not configured' }, { status: 503 }) }

  const { data: invoice } = await admin
    .from('invoices')
    .select('id, invoice_number, amount, status, leases!inner(tenant_id, units!inner(properties!inner(owner_id, manager_id)))')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  if (invoice.status === 'paid') return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })

  type Chain = { tenant_id?: string; units?: { properties?: { owner_id?: string; manager_id?: string } }[] }[]
  const lease = ((invoice as unknown as { leases?: Chain }).leases ?? [])[0]
  const property = lease?.units?.[0]?.properties
  const ownerId = property?.owner_id
  const allowed = [lease?.tenant_id, property?.owner_id, property?.manager_id].filter(Boolean)
  if (!allowed.includes(user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!ownerId) return NextResponse.json({ error: 'Invoice has no linked property owner' }, { status: 400 })

  const connection = await getConnection(admin, ownerId, 'payfast')
  const credentials = payfastCredentialsFrom(connection)
  if (!credentials) return NextResponse.json({ error: 'The landlord has not connected Payfast yet' }, { status: 400 })

  const { data: profile } = await admin.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin
  const checkout = buildPayfastCheckout(
    { id: invoice.id as string, amount: Number(invoice.amount), invoice_number: invoice.invoice_number as string },
    { full_name: profile?.full_name, email: profile?.email ?? user.email ?? '' },
    { credentials, siteUrl },
  )
  return NextResponse.json({ ...checkout, mode: credentials.mode })
}
