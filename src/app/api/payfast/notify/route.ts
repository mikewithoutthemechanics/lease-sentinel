import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePayfastSignature } from '@/lib/payments/payfast'

export async function POST(request: Request) {
  const formData = await request.formData()
  const data = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]))
  const signature = generatePayfastSignature(data, process.env.PAYFAST_PASSPHRASE)
  if (!data.signature || !cryptoSafeEqual(signature, data.signature)) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  if (data.payment_status !== 'COMPLETE' || !data.m_payment_id || !data.pf_payment_id) return new Response('Ignored', { status: 200 })

  let supabase
  try { supabase = createAdminClient() } catch { return NextResponse.json({ error: 'Payment processing is not configured' }, { status: 503 }) }
  const { data: existing } = await supabase.from('payments').select('id').eq('provider', 'payfast').eq('raw_reference', data.pf_payment_id).maybeSingle()
  if (existing) return new Response('Already processed', { status: 200 })

  const { data: invoice } = await supabase.from('invoices').select('id, amount').eq('id', data.m_payment_id).maybeSingle()
  if (!invoice || Number(data.amount_gross) !== Number(invoice.amount)) return NextResponse.json({ error: 'Invoice amount mismatch' }, { status: 400 })
  const { error } = await supabase.from('payments').insert({ invoice_id: invoice.id, amount: Number(data.amount_gross), payment_method: 'Payfast', transaction_id: data.pf_payment_id, provider: 'payfast', raw_reference: data.pf_payment_id })
  if (error && !error.message.toLowerCase().includes('duplicate')) return NextResponse.json({ error: error.message }, { status: 400 })
  await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id)
  return new Response('OK', { status: 200 })
}

function cryptoSafeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}
