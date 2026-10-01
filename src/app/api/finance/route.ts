import { NextResponse } from 'next/server'
import { addMonths, addQuarters, addYears, format, isBefore, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

const money = (value: unknown) => Number(value ?? 0)

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const url = new URL(request.url)
  const month = url.searchParams.get('month') || format(new Date(), 'yyyy-MM')
  const start = `${month}-01`
  const end = format(addMonths(parseISO(start), 1), 'yyyy-MM-dd')

  const [{ data: invoices, error: invoiceError }, { data: payments, error: paymentError }, { data: expenses, error: expenseError }, { data: properties, error: propertyError }, { data: units, error: unitError }, { data: leases, error: leaseError }, { data: distributions, error: distributionError }, { data: bankTransactions, error: bankError }] = await Promise.all([
    supabase.from('invoices').select('id, invoice_number, amount, vat_amount, due_date, status, description, leases(tenant_id, units(unit_number, properties(id, name)))').order('due_date', { ascending: false }),
    supabase.from('payments').select('id, invoice_id, amount, payment_method, transaction_id, payment_date').gte('payment_date', start).lt('payment_date', end).order('payment_date', { ascending: false }),
    supabase.from('expenses').select('id, property_id, category, description, supplier, amount, vat_amount, expense_date, status').gte('expense_date', start).lt('expense_date', end).order('expense_date', { ascending: false }),
    supabase.from('properties').select('id, name, city, province').order('name'),
    supabase.from('units').select('id, property_id, unit_number').order('unit_number'),
    supabase.from('leases').select('id, unit_id, tenant_id, rent_amount, status, profiles(full_name, email)').eq('status', 'active'),
    supabase.from('owner_distributions').select('id, property_id, amount, status, created_at, properties(name)').in('status', ['pending', 'approved']).order('created_at', { ascending: false }),
    supabase.from('bank_transactions').select('id, transaction_date, description, reference, amount, balance, status, property_id').eq('status', 'unmatched').order('transaction_date', { ascending: false }).limit(20),
  ])
  if (invoiceError || paymentError || expenseError || propertyError || unitError || leaseError || distributionError || bankError) return NextResponse.json({ error: (invoiceError || paymentError || expenseError || propertyError || unitError || leaseError || distributionError || bankError)?.message }, { status: 400 })

  const today = new Date()
  const normalisedInvoices = (invoices ?? []).map(invoice => ({ ...invoice, status: invoice.status === 'unpaid' && isBefore(parseISO(invoice.due_date), today) ? 'overdue' : invoice.status }))
  const totalExpected = normalisedInvoices.filter(i => i.due_date >= start && i.due_date < end).reduce((sum, i) => sum + money(i.amount), 0)
  const totalCollected = (payments ?? []).reduce((sum, p) => sum + money(p.amount), 0)
  const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + money(e.amount), 0)
  const arrears = normalisedInvoices.filter(i => ['unpaid', 'overdue'].includes(i.status)).map(i => ({ ...i, outstanding: money(i.amount) }))
  return NextResponse.json({ month, invoices: normalisedInvoices, payments: payments ?? [], expenses: expenses ?? [], properties: properties ?? [], units: units ?? [], leases: leases ?? [], distributions: distributions ?? [], bankTransactions: bankTransactions ?? [], arrears, summary: { totalExpected, totalCollected, totalExpenses, outstanding: arrears.reduce((sum, i) => sum + i.outstanding, 0) } })
}

export async function POST(request: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await request.json() as Record<string, unknown>
  const action = body.action

  if (action === 'expense') {
    const amount = Number(body.amount)
    const vatAmount = Number(body.vatAmount ?? 0)
    if (!body.propertyId || !body.description || !Number.isFinite(amount) || amount <= 0 || !body.category) return NextResponse.json({ error: 'propertyId, category, description and a positive amount are required' }, { status: 400 })
    const { data, error } = await supabase.from('expenses').insert({ property_id: body.propertyId, unit_id: body.unitId || null, category: body.category, description: body.description, supplier: body.supplier || null, amount, vat_amount: vatAmount, expense_date: body.expenseDate || format(new Date(), 'yyyy-MM-dd'), status: body.status || 'unpaid', created_by: user.id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ expense: data }, { status: 201 })
  }

  if (action === 'import-bank-csv') {
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (!rows.length) return NextResponse.json({ error: 'No bank rows supplied' }, { status: 400 })
    const inserts = rows.map((row) => { const item = row as Record<string, unknown>; return { property_id: item.propertyId || null, transaction_date: item.date, description: item.description, reference: item.reference || null, amount: Number(item.amount), balance: item.balance ? Number(item.balance) : null, source: 'csv', created_by: user.id } })
    const { data, error } = await supabase.from('bank_transactions').upsert(inserts, { onConflict: 'source,reference,transaction_date,amount', ignoreDuplicates: true }).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ imported: data?.length ?? 0 })
  }

  if (action === 'create-statement') {
    if (!body.propertyId || !body.periodStart || !body.periodEnd) return NextResponse.json({ error: 'propertyId, periodStart and periodEnd are required' }, { status: 400 })
    const { data: propertyExpenses } = await supabase.from('expenses').select('amount').eq('property_id', body.propertyId).gte('expense_date', body.periodStart).lte('expense_date', body.periodEnd)
    const { data: propertyInvoices } = await supabase.from('invoices').select('amount, leases!inner(units!inner(properties!inner(id)))').eq('leases.units.properties.id', body.propertyId).gte('due_date', body.periodStart).lte('due_date', body.periodEnd).eq('status', 'paid')
    const income = (propertyInvoices ?? []).reduce((sum, row) => sum + money(row.amount), 0)
    const expenses = (propertyExpenses ?? []).reduce((sum, row) => sum + money(row.amount), 0)
    const { data, error } = await supabase.from('owner_statements').upsert({ property_id: body.propertyId, period_start: body.periodStart, period_end: body.periodEnd, income, expenses, owner_amount: income - expenses, status: 'draft' }, { onConflict: 'property_id,period_start,period_end' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ statement: data })
  }

  if (action === 'approve-statement') {
    if (!body.statementId) return NextResponse.json({ error: 'statementId is required' }, { status: 400 })
    const { data, error } = await supabase.from('owner_statements').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', body.statementId).eq('status', 'draft').select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ statement: data })
  }

  if (action === 'email-statement') {
    if (!body.statementId || !body.recipientId) return NextResponse.json({ error: 'statementId and recipientId are required' }, { status: 400 })
    const { data, error } = await supabase.from('notification_queue').insert({ recipient_id: body.recipientId, channel: 'email', template: 'owner_statement', payload: { statementId: body.statementId }, scheduled_for: new Date().toISOString() }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await supabase.from('owner_statements').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', body.statementId).eq('status', 'approved')
    return NextResponse.json({ notification: data })
  }

  if (action === 'approve-distribution') {
    if (!body.distributionId) return NextResponse.json({ error: 'distributionId is required' }, { status: 400 })
    const { data, error } = await supabase.from('owner_distributions').update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() }).eq('id', body.distributionId).eq('status', 'pending').select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ distribution: data })
  }

  if (action === 'create-distribution') {
    if (!body.propertyId || !Number(body.amount) || Number(body.amount) <= 0) return NextResponse.json({ error: 'propertyId and a positive amount are required' }, { status: 400 })
    const { data, error } = await supabase.from('owner_distributions').insert({ property_id: body.propertyId, statement_id: body.statementId || null, amount: Number(body.amount), status: 'pending' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ distribution: data }, { status: 201 })
  }

  if (action === 'match-bank') {
    if (!body.bankTransactionId || (!body.paymentId && !body.expenseId) || (body.paymentId && body.expenseId)) return NextResponse.json({ error: 'Choose exactly one payment or expense to match' }, { status: 400 })
    const { data: bankLine, error: bankError } = await supabase.from('bank_transactions').select('id, amount, status').eq('id', body.bankTransactionId).single()
    if (bankError || !bankLine) return NextResponse.json({ error: 'Bank transaction is no longer available' }, { status: 409 })
    const targetTable = body.paymentId ? 'payments' : 'expenses'
    const targetId = body.paymentId || body.expenseId
    const { data: target, error: targetError } = await supabase.from(targetTable).select('id, amount').eq('id', targetId).single()
    if (targetError || !target) return NextResponse.json({ error: 'Selected match could not be found' }, { status: 404 })
    const amount = Number(body.allocationAmount ?? Math.min(Math.abs(Number(bankLine.amount)), Math.abs(Number(target.amount))))
    if (!Number.isFinite(amount) || amount <= 0 || amount > Math.abs(Number(bankLine.amount)) + 0.01 || amount > Math.abs(Number(target.amount)) + 0.01) return NextResponse.json({ error: 'Allocation must be positive and cannot exceed the bank line or selected record' }, { status: 422 })
    const { data: match, error: matchError } = await supabase.from('reconciliation_matches').insert({ bank_transaction_id: bankLine.id, payment_id: body.paymentId || null, expense_id: body.expenseId || null, allocated_amount: amount, match_type: body.paymentId ? 'payment' : 'expense', created_by: user.id }).select().single()
    if (matchError) return NextResponse.json({ error: matchError.message }, { status: 400 })
    await supabase.from('reconciliation_audit').insert({ bank_transaction_id: bankLine.id, action: amount < Math.abs(Number(bankLine.amount)) ? 'split' : (amount > Math.abs(Number(target.amount)) ? 'overpayment' : 'matched'), match_id: match.id, metadata: { targetId, allocationAmount: amount }, actor_id: user.id })
    await supabase.rpc('refresh_bank_transaction_status', { target_id: bankLine.id })
    return NextResponse.json({ match }, { status: 201 })
  }

  if (action === 'unmatch-bank') {
    if (!body.matchId) return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    const { data: match, error } = await supabase.from('reconciliation_matches').update({ reversed_at: new Date().toISOString() }).eq('id', body.matchId).is('reversed_at', null).select('id, bank_transaction_id').single()
    if (error || !match) return NextResponse.json({ error: error?.message || 'Match not found' }, { status: 404 })
    await supabase.from('reconciliation_audit').insert({ bank_transaction_id: match.bank_transaction_id, action: 'unmatched', match_id: match.id, actor_id: user.id })
    await supabase.rpc('refresh_bank_transaction_status', { target_id: match.bank_transaction_id })
    return NextResponse.json({ match })
  }

  if (action === 'run-recurring') {
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: charges, error: chargeError } = await supabase.from('recurring_charges').select('id, lease_id, description, amount, vat_rate, frequency, next_run_date').eq('active', true).lte('next_run_date', today)
    if (chargeError) return NextResponse.json({ error: chargeError.message }, { status: 400 })
    let created = 0
    for (const charge of charges ?? []) {
      const vat = money(charge.amount) * money(charge.vat_rate)
      const { error } = await supabase.from('invoices').insert({ lease_id: charge.lease_id, invoice_number: `REC-${format(new Date(), 'yyyyMMdd')}-${charge.id.slice(0, 8)}`, amount: money(charge.amount) + vat, vat_amount: vat, due_date: today, status: 'unpaid', description: charge.description })
      if (!error) { created += 1; const next = charge.frequency === 'annual' ? addYears(parseISO(charge.next_run_date), 1) : charge.frequency === 'quarterly' ? addQuarters(parseISO(charge.next_run_date), 1) : addMonths(parseISO(charge.next_run_date), 1); await supabase.from('recurring_charges').update({ next_run_date: format(next, 'yyyy-MM-dd') }).eq('id', charge.id) }
    }
    return NextResponse.json({ created })
  }

  return NextResponse.json({ error: 'Unknown finance action' }, { status: 400 })
}
