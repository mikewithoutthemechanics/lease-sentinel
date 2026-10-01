import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createAdminClient()
  const { data: overdue } = await supabase.from('maintenance_requests').select('id, title, tenant_id, priority, sla_due_at').in('status', ['open', 'assigned', 'in_progress']).lt('sla_due_at', new Date().toISOString())
  let queued = 0
  for (const item of overdue ?? []) {
    await supabase.from('notification_queue').insert({ recipient_id: item.tenant_id, channel: 'email', template: 'maintenance_sla_breach', payload: { requestId: item.id, title: item.title, priority: item.priority }, scheduled_for: new Date().toISOString() })
    queued += 1
  }
  return NextResponse.json({ overdue: overdue?.length ?? 0, notificationsQueued: queued })
}
