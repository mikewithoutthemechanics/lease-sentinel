import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const url = new URL(request.url)
  const bankTransactionId = url.searchParams.get('bankTransactionId')
  const query = (url.searchParams.get('q') || '').trim()
  if (!bankTransactionId) return NextResponse.json({ error: 'bankTransactionId is required' }, { status: 400 })
  const { data: line, error: lineError } = await supabase.from('bank_transactions').select('id, amount, transaction_date, description, reference').eq('id', bankTransactionId).single()
  if (lineError || !line) return NextResponse.json({ error: 'Bank transaction not found' }, { status: 404 })
  const [paymentsResult, expensesResult, auditResult] = await Promise.all([
    supabase.from('payments').select('id, invoice_id, amount, payment_method, transaction_id, payment_date, invoices(invoice_number, leases(tenant_id, profiles(full_name)))').order('payment_date', { ascending: false }).limit(100),
    supabase.from('expenses').select('id, description, supplier, amount, expense_date, category').order('expense_date', { ascending: false }).limit(100),
    supabase.from('reconciliation_audit').select('id, action, metadata, created_at').eq('bank_transaction_id', bankTransactionId).order('created_at', { ascending: false }).limit(20),
  ])
  if (paymentsResult.error || expensesResult.error || auditResult.error) return NextResponse.json({ error: (paymentsResult.error || expensesResult.error)?.message }, { status: 400 })
  const needle = query.toLowerCase()
  const score = (amount: number, date: string, text: string) => {
    const amountScore = Math.abs(Math.abs(Number(line.amount)) - Math.abs(amount)) < 0.01 ? 70 : Math.abs(Math.abs(Number(line.amount)) - Math.abs(amount)) <= 5 ? 35 : 0
    const dateScore = date === line.transaction_date ? 20 : Math.abs(new Date(date).getTime() - new Date(line.transaction_date).getTime()) <= 3 * 86400000 ? 10 : 0
    const textScore = needle && text.toLowerCase().includes(needle) ? 10 : (!needle && text.toLowerCase().includes(String(line.reference || '').toLowerCase())) ? 10 : 0
    return amountScore + dateScore + textScore
  }
  const payments = (paymentsResult.data ?? []).map(item => ({ ...item, confidence: score(item.amount, item.payment_date.slice(0, 10), `${item.transaction_id || ''} ${item.invoices?.[0]?.invoice_number || ''} ${item.invoices?.[0]?.leases?.[0]?.profiles?.[0]?.full_name || ''}`), matchType: 'payment' }))
  const expenses = (expensesResult.data ?? []).map(item => ({ ...item, confidence: score(item.amount, item.expense_date, `${item.description} ${item.supplier || ''} ${item.category}`), matchType: 'expense' }))
  return NextResponse.json({ line, audit: auditResult.data ?? [], payments: payments.filter(item => !needle || JSON.stringify(item).toLowerCase().includes(needle)).sort((a, b) => b.confidence - a.confidence), expenses: expenses.filter(item => !needle || JSON.stringify(item).toLowerCase().includes(needle)).sort((a, b) => b.confidence - a.confidence) })
}
