import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { nextRetryAt, type PayfastMode } from '@/lib/payments/payfast'
import { processPayfastItn } from '@/lib/payments/payfast-itn'
import { getConnection } from '@/lib/integrations/connections'

const MAX_ATTEMPTS = 6

/** Replays webhook deliveries that failed processing, with exponential backoff. */
export async function POST(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const supabase = createAdminClient()
  const { data: events, error } = await supabase
    .from('integration_webhook_events')
    .select('id, owner_id, provider, payload, attempts')
    .eq('status', 'failed')
    .eq('provider', 'payfast')
    .lt('attempts', MAX_ATTEMPTS)
    .lte('next_retry_at', new Date().toISOString())
    .limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let recovered = 0
  for (const event of events ?? []) {
    const attempts = (event.attempts ?? 0) + 1
    const connection = event.owner_id ? await getConnection(supabase, event.owner_id, 'payfast') : null
    try {
      const result = await processPayfastItn(supabase, event.payload as Record<string, string>, { ownerId: event.owner_id, mode: (connection?.mode ?? 'sandbox') as PayfastMode })
      if (result.outcome === 'failed') throw new Error(result.message)
      await supabase.from('integration_webhook_events').update({ status: result.outcome === 'ignored' ? 'ignored' : 'processed', attempts, last_error: null, next_retry_at: null, processed_at: new Date().toISOString() }).eq('id', event.id)
      recovered += 1
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : 'Retry failed'
      await supabase.from('integration_webhook_events').update({ attempts, last_error: message, next_retry_at: attempts >= MAX_ATTEMPTS ? null : nextRetryAt(attempts) }).eq('id', event.id)
    }
  }
  return NextResponse.json({ processed: events?.length ?? 0, recovered })
}
