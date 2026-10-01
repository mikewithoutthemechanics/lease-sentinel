import { NextResponse } from 'next/server'
import { addHours, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  let query = supabase.from('maintenance_requests').select('id, title, description, status, priority, category, photo_url, created_at, sla_due_at, resolved_at, contractor_id, units(unit_number, properties(id, name, city)), profiles!maintenance_requests_tenant_id_fkey(full_name)').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const [{ data: requests, error }, { data: contractors, error: contractorError }] = await Promise.all([query, supabase.from('profiles').select('id, full_name, email, phone').eq('role', 'contractor').order('full_name')])
  if (error || contractorError) return NextResponse.json({ error: (error || contractorError)?.message }, { status: 400 })
  const counts = { open: 0, assigned: 0, in_progress: 0, completed: 0, emergency: 0 }
  for (const item of requests ?? []) { if (item.status in counts) counts[item.status as keyof typeof counts] += 1; if (item.priority === 'emergency') counts.emergency += 1 }
  return NextResponse.json({ requests: requests ?? [], contractors: contractors ?? [], counts })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await request.json() as Record<string, unknown>
  if (body.action === 'create') {
    if (!body.unitId || !body.description) return NextResponse.json({ error: 'unitId and description are required' }, { status: 400 })
    const priority = body.priority || 'normal'
    const slaHours = priority === 'emergency' ? 4 : priority === 'high' ? 24 : 72
    const { data, error } = await supabase.from('maintenance_requests').insert({ unit_id: body.unitId, tenant_id: user.id, title: body.title || 'Maintenance request', description: body.description, category: body.category || 'general', priority, status: 'open', sla_due_at: addHours(new Date(), slaHours).toISOString(), photo_url: body.photoUrl || null }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ request: data }, { status: 201 })
  }
  if (!body.requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
  if (body.action === 'update') {
    const allowed = ['status', 'priority', 'category', 'contractor_id']
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
    if (updates.status === 'completed') updates.resolved_at = new Date().toISOString()
    const { data, error } = await supabase.from('maintenance_requests').update(updates).eq('id', body.requestId).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ request: data })
  }
  if (body.action === 'quote') {
    if (!body.contractorId || !body.amount || !body.description) return NextResponse.json({ error: 'contractorId, amount and description are required' }, { status: 400 })
    const { data, error } = await supabase.from('maintenance_quotes').insert({ request_id: body.requestId, contractor_id: body.contractorId, amount: body.amount, description: body.description, valid_until: body.validUntil || null }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ quote: data }, { status: 201 })
  }
  if (body.action === 'comment') {
    if (!body.body) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
    const { data, error } = await supabase.from('maintenance_comments').insert({ request_id: body.requestId, author_id: user.id, body: body.body, internal: Boolean(body.internal) }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ comment: data }, { status: 201 })
  }
  return NextResponse.json({ error: 'Unknown maintenance action' }, { status: 400 })
}
