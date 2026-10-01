import { NextResponse } from 'next/server'
import { format, subMonths } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createAdminClient()
  const runKey = `financial-close-${format(new Date(), 'yyyy-MM')}`
  const { data: job, error: jobError } = await supabase.from('finance_jobs').upsert({ job_type: 'owner_statements', run_key: runKey, status: 'started', started_at: new Date().toISOString() }, { onConflict: 'run_key' }).select().single()
  if (jobError || !job) return NextResponse.json({ error: jobError?.message || 'Unable to start financial job' }, { status: 500 })
  try {
    const periodStart = format(subMonths(new Date(), 1), 'yyyy-MM-01')
    const periodEnd = format(new Date(new Date().getFullYear(), new Date().getMonth(), 0), 'yyyy-MM-dd')
    const { data: properties } = await supabase.from('properties').select('id')
    let statements = 0
    for (const property of properties ?? []) {
      const [{ data: expenses }, { data: invoices }] = await Promise.all([
        supabase.from('expenses').select('amount').eq('property_id', property.id).gte('expense_date', periodStart).lte('expense_date', periodEnd),
        supabase.from('invoices').select('amount, leases!inner(units!inner(properties!inner(id)))').eq('leases.units.properties.id', property.id).gte('due_date', periodStart).lte('due_date', periodEnd).eq('status', 'paid'),
      ])
      const income = (invoices ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
      const costs = (expenses ?? []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
      await supabase.from('owner_statements').upsert({ property_id: property.id, period_start: periodStart, period_end: periodEnd, income, expenses: costs, owner_amount: income - costs, status: 'draft' }, { onConflict: 'property_id,period_start,period_end' })
      statements += 1
    }
    await supabase.from('finance_jobs').update({ status: 'completed', completed_at: new Date().toISOString(), result: { statements } }).eq('id', job.id)
    return NextResponse.json({ statements, periodStart, periodEnd })
  } catch (error) {
    await supabase.from('finance_jobs').update({ status: 'failed', error: error instanceof Error ? error.message : 'Unknown error', completed_at: new Date().toISOString() }).eq('id', job.id)
    return NextResponse.json({ error: 'Financial close failed' }, { status: 500 })
  }
}
