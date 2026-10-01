import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/providers'

export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createAdminClient()
  const { data: queue, error } = await supabase.from('notification_queue').select('id, channel, template, payload, attempts, profiles(email, phone, full_name)').eq('status', 'queued').lte('scheduled_for', new Date().toISOString()).lt('attempts', 3).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  let sent = 0
  for (const item of queue ?? []) {
    try {
      const recipient = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      await sendNotification(item.channel as 'email' | 'sms', recipient || {}, item.payload as { subject?: string; body?: string })
      await supabase.from('notification_queue').update({ status: 'sent', sent_at: new Date().toISOString(), attempts: item.attempts + 1 }).eq('id', item.id)
      sent += 1
    } catch (notificationError) {
      await supabase.from('notification_queue').update({ status: item.attempts + 1 >= 3 ? 'failed' : 'queued', attempts: item.attempts + 1, last_error: notificationError instanceof Error ? notificationError.message : 'Notification failed', scheduled_for: new Date(Date.now() + (item.attempts + 1) * 15 * 60 * 1000).toISOString() }).eq('id', item.id)
    }
  }
  return NextResponse.json({ processed: queue?.length ?? 0, sent })
}
