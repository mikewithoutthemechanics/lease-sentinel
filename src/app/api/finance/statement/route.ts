import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorised', { status: 401 })
  const url = new URL(request.url)
  const propertyId = url.searchParams.get('propertyId')
  const start = url.searchParams.get('start') || `${new Date().getFullYear()}-01-01`
  const end = url.searchParams.get('end') || new Date().toISOString().slice(0, 10)
  if (!propertyId) return new Response('propertyId is required', { status: 400 })
  const [{ data: property }, { data: expenses }, { data: invoices }] = await Promise.all([
    supabase.from('properties').select('name, address, city, province').eq('id', propertyId).single(),
    supabase.from('expenses').select('expense_date, description, supplier, amount, category').eq('property_id', propertyId).gte('expense_date', start).lte('expense_date', end).order('expense_date'),
    supabase.from('invoices').select('invoice_number, due_date, amount, status, leases!inner(units!inner(properties!inner(id)))').eq('leases.units.properties.id', propertyId).gte('due_date', start).lte('due_date', end).order('due_date'),
  ])
  const lines = [['Lease Sentinel owner statement'], ['Property', property?.name || propertyId], ['Period', `${start} to ${end}`], [], ['Date', 'Type', 'Reference', 'Description', 'Amount', 'Status']]
  for (const invoice of invoices ?? []) lines.push([invoice.due_date, 'Income', invoice.invoice_number, invoice.invoice_number, String(invoice.amount), invoice.status])
  for (const expense of expenses ?? []) lines.push([expense.expense_date, 'Expense', expense.category, `${expense.description}${expense.supplier ? ` · ${expense.supplier}` : ''}`, String(expense.amount), 'Recorded'])
  const csv = lines.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="owner-statement-${propertyId}-${start}.csv"` } })
}
