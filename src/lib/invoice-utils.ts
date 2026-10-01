import { format } from 'date-fns'

export function generateInvoiceNumber(clientCode: string, unitNumber: string, date: Date) {
  const dateStr = format(date, 'yyyyMMdd')
  return `${clientCode}-${unitNumber}-${dateStr}`.toUpperCase()
}

export async function createInvoice(supabase: any, data: {
  leaseId: string,
  clientCode: string,
  unitNumber: string,
  amount: number,
  description: string,
  dueDate: Date,
  vatRate?: number
}) {
  const invoiceNumber = generateInvoiceNumber(data.clientCode, data.unitNumber, new Date())
  // Do not assume VAT on every rental: residential rent is generally VAT-exempt.
  // Pass 0.15 only when the landlord/property entity is VAT-registered and the charge is taxable.
  const vatRate = data.vatRate ?? 0
  const vatAmount = data.amount * vatRate

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      lease_id: data.leaseId,
      invoice_number: invoiceNumber,
      amount: data.amount + vatAmount,
      vat_amount: vatAmount,
      due_date: format(data.dueDate, 'yyyy-MM-dd'),
      description: data.description,
      status: 'unpaid'
    })
    .select()
    .single()

  if (error) throw error
  return invoice
}
