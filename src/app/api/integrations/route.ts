import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const [{ data: connections }, { data: rules }, { data: approvals }, { data: audit }] = await Promise.all([
    supabase.from('integration_connections').select('*').eq('owner_id', user.id).order('provider'),
    supabase.from('automation_rules').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('ai_action_approvals').select('*').eq('owner_id', user.id).eq('status', 'pending').order('created_at', { ascending: false }),
    supabase.from('audit_events').select('*').eq('actor_id', user.id).order('created_at', { ascending: false }).limit(30),
  ])
  return NextResponse.json({ connections: connections ?? [], rules: rules ?? [], approvals: approvals ?? [], audit: audit ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await request.json() as Record<string, unknown>
  if (body.action === 'connect') {
    const { data, error } = await supabase.from('integration_connections').upsert({ owner_id: user.id, provider: body.provider, status: body.provider === 'bank_csv' ? 'connected' : 'disconnected', settings: body.settings || {} }, { onConflict: 'owner_id,provider' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await supabase.from('audit_events').insert({ actor_id: user.id, action: 'integration_connected', entity_type: 'integration', entity_id: data.id, source: 'user', metadata: { provider: body.provider } })
    return NextResponse.json({ connection: data })
  }
  if (body.action === 'toggle-rule') {
    const { data, error } = await supabase.from('automation_rules').update({ enabled: Boolean(body.enabled) }).eq('id', body.ruleId).eq('owner_id', user.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 }); return NextResponse.json({ rule: data })
  }
  if (body.action === 'approve-ai' || body.action === 'reject-ai') {
    const status = body.action === 'approve-ai' ? 'approved' : 'rejected'
    const { data, error } = await supabase.from('ai_action_approvals').update({ status, reviewed_at: new Date().toISOString() }).eq('id', body.approvalId).eq('owner_id', user.id).eq('status', 'pending').select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await supabase.from('audit_events').insert({ actor_id: user.id, action: `ai_action_${status}`, entity_type: 'ai_action', entity_id: data.id, source: 'user' }); return NextResponse.json({ approval: data })
  }
  return NextResponse.json({ error: 'Unknown integration action' }, { status: 400 })
}
