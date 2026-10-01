import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const readTools = ['portfolio_summary', 'open_maintenance', 'arrears', 'expiring_leases', 'owner_statements']
const writeTools = ['draft_tenant_message', 'prepare_rent_reminders', 'prepare_renewal_plan', 'compare_contractor_quotes']

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await request.json() as { tool?: string; input?: Record<string, unknown> }
  if (!body.tool) return NextResponse.json({ error: 'tool is required' }, { status: 400 })
  if (writeTools.includes(body.tool)) {
    const { data, error } = await supabase.from('ai_action_approvals').insert({ owner_id: user.id, tool_name: body.tool, input: body.input || {}, status: 'pending' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await supabase.from('audit_events').insert({ actor_id: user.id, action: 'ai_action_requested', entity_type: 'ai_action', entity_id: data.id, source: 'ai', metadata: { tool: body.tool } })
    return NextResponse.json({ requiresApproval: true, approval: data }, { status: 202 })
  }
  if (!readTools.includes(body.tool)) return NextResponse.json({ error: 'Unknown or unavailable tool' }, { status: 404 })
  if (body.tool === 'open_maintenance') { const { data } = await supabase.from('maintenance_requests').select('id,title,status,priority,category,created_at').in('status', ['open', 'assigned', 'in_progress']); return NextResponse.json({ tool: body.tool, data: data ?? [] }) }
  if (body.tool === 'arrears') { const { data } = await supabase.from('invoices').select('invoice_number,amount,due_date,status').in('status', ['unpaid', 'overdue']); return NextResponse.json({ tool: body.tool, data: data ?? [] }) }
  if (body.tool === 'owner_statements') { const { data } = await supabase.from('owner_statements').select('*').order('period_end', { ascending: false }).limit(12); return NextResponse.json({ tool: body.tool, data: data ?? [] }) }
  if (body.tool === 'expiring_leases') { const until = new Date(); until.setDate(until.getDate() + 90); const { data } = await supabase.from('leases').select('id,start_date,end_date,rent_amount,status').eq('status', 'active').lte('end_date', until.toISOString().slice(0, 10)); return NextResponse.json({ tool: body.tool, data: data ?? [] }) }
  const [{ count: properties }, { count: maintenance }] = await Promise.all([supabase.from('properties').select('id', { count: 'exact', head: true }), supabase.from('maintenance_requests').select('id', { count: 'exact', head: true }).in('status', ['open', 'assigned', 'in_progress'])])
  return NextResponse.json({ tool: body.tool, data: { properties: properties ?? 0, openMaintenance: maintenance ?? 0 } })
}
