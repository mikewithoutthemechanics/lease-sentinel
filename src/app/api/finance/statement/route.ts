import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorised', { status: 401 })
  const url = new URL(request.url)
  const propertyId = url.searchParams.get('propertyId')
  const start = url.searchParams.get('start') || `${new Date().getFullYear()}-01-01`
  const end = url.searchParams.get('end') || new Date().toISOString().slice(0, 10)
  if (!propertyId) {
    const { data, error } = await supabase.from('owner_statements').select('id, property_id, period_start, period_end, income, expenses, owner_amount, status, created_at, properties(name)').order('created_at', { ascending: false })
    if (error) return new Response(error.message, { status: 400 })
    return Response.json({ statements: data ?? [] })
  }
  const [{ data: property }, { data: expenses }, { data: invoices }] = await Promise.all([
    supabase.from('properties').select('name, address, city, province').eq('id', propertyId).single(),
    supabase.from('expenses').select('expense_date, description, supplier, amount, category').eq('property_id', propertyId).gte('expense_date', start).lte('expense_date', end).order('expense_date'),
    supabase.from('invoices').select('invoice_number, due_date, amount, status, leases!inner(units!inner(properties!inner(id)))').eq('leases.units.properties.id', propertyId).gte('due_date', start).lte('due_date', end).order('due_date'),
  ])
  const lines = [['Lease Sentinel owner statement'], ['Property', property?.name || propertyId], ['Period', `${start} to ${end}`], [], ['Date', 'Type', 'Reference', 'Description', 'Amount', 'Status']]
  for (const invoice of invoices ?? []) lines.push([invoice.due_date, 'Income', invoice.invoice_number, invoice.invoice_number, String(invoice.amount), invoice.status])
  for (const expense of expenses ?? []) lines.push([expense.expense_date, 'Expense', expense.category, `${expense.description}${expense.supplier ? ` · ${expense.supplier}` : ''}`, String(expense.amount), 'Recorded'])
  const formatType = url.searchParams.get('format') || 'csv'
  if (formatType === 'pdf') {
    const pdf = await PDFDocument.create()
    const page = pdf.addPage([595, 842])
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
    page.drawText('Lease Sentinel owner statement', { x: 44, y: 790, size: 18, font: bold, color: rgb(0.1, 0.23, 0.22) })
    page.drawText(`${property?.name || propertyId} · ${start} to ${end}`, { x: 44, y: 766, size: 10, font })
    let y = 730
    for (const row of lines.slice(4)) { page.drawText(row.join(' | ').slice(0, 95), { x: 44, y, size: 8, font }); y -= 16; if (y < 50) break }
    const bytes = await pdf.save()
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="owner-statement-${propertyId}-${start}.pdf"` } })
  }
  const csv = lines.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="owner-statement-${propertyId}-${start}.csv"` } })
}
