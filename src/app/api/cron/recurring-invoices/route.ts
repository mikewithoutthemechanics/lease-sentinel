import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase.rpc('run_due_recurring_invoices')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ created: data ?? 0 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Cron configuration error' }, { status: 500 })
  }
}
