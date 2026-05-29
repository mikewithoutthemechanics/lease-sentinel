import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const data = Object.fromEntries(formData)

  if (data.payment_status === 'COMPLETE') {
    const supabase = await createClient()
    const invoiceId = data.m_payment_id as string

    await supabase
      .from('invoices')
      .update({ status: 'paid' })
      .eq('id', invoiceId)

    await supabase.from('payments').insert({
      invoice_id: invoiceId,
      amount: parseFloat(data.amount_gross as string),
      payment_method: 'Payfast',
      transaction_id: data.pf_payment_id as string
    })
  }

  return new Response('OK', { status: 200 })
}
