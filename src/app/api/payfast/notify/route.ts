import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { itnIdempotencyKey, nextRetryAt, PAYFAST_ITN_HOSTS, validateItnWithPayfast, verifyPayfastSignature, type PayfastMode } from '@/lib/payments/payfast'
import { findConnectionByMerchantId, payfastCredentialsFrom, recordAudit } from '@/lib/integrations/connections'
import { processPayfastItn } from '@/lib/payments/payfast-itn'

export const dynamic = 'force-dynamic'

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null
}

/** Defence in depth: Payfast only posts from its own hosts. */
async function sourceLooksValid(request: Request) {
  if (process.env.PAYFAST_SKIP_SOURCE_CHECK === 'true') return true
  const ip = clientIp(request)
  if (!ip) return false
  try {
    const dns = await import('node:dns/promises')
    const hostnames = await dns.reverse(ip)
    return hostnames.some((hostname) => PAYFAST_ITN_HOSTS.includes(hostname.toLowerCase()) || hostname.toLowerCase().endsWith('.payfast.co.za'))
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const payload = Object.fromEntries(new URLSearchParams(rawBody).entries())
  const idempotencyKey = itnIdempotencyKey(payload)
  const sourceIp = clientIp(request)

  let supabase
  try { supabase = createAdminClient() } catch { return NextResponse.json({ error: 'Payment processing is not configured' }, { status: 503 }) }

  // 1. Idempotency: a replayed ITN never re-applies funds.
  const { data: existingEvent } = await supabase.from('integration_webhook_events').select('*').eq('provider', 'payfast').eq('idempotency_key', idempotencyKey).maybeSingle()
  if (existingEvent && (existingEvent.status === 'processed' || existingEvent.status === 'ignored')) return new Response('Already processed', { status: 200 })
  if (existingEvent && existingEvent.status === 'rejected') return new Response('Rejected', { status: 400 })

  // 2. Resolve the merchant account this callback belongs to.
  const connection = payload.merchant_id ? await findConnectionByMerchantId(supabase, payload.merchant_id) : null
  const credentials = payfastCredentialsFrom(connection)
  const mode: PayfastMode = connection?.mode ?? credentials?.mode ?? 'sandbox'
  const ownerId = connection?.owner_id ?? null

  // 3. Verify the signature, then ask Payfast to confirm it sent this payload.
  const signatureValid = verifyPayfastSignature(payload, credentials?.passphrase)
  const merchantMatches = !credentials || credentials.merchantId === payload.merchant_id
  let sourceVerified = false
  if (signatureValid && merchantMatches) {
    sourceVerified = process.env.PAYFAST_SKIP_SERVER_VALIDATE === 'true'
      ? true
      : (await sourceLooksValid(request)) && (await validateItnWithPayfast(payload, mode).catch(() => false))
  }

  const attempts = (existingEvent?.attempts ?? 0) + 1
  const baseEvent = {
    owner_id: ownerId,
    provider: 'payfast' as const,
    event_type: `itn.${(payload.payment_status ?? 'unknown').toLowerCase()}`,
    idempotency_key: idempotencyKey,
    external_id: payload.pf_payment_id ?? null,
    signature_valid: signatureValid,
    source_verified: sourceVerified,
    source_ip: sourceIp,
    payload,
    attempts,
  }

  async function saveEvent(status: 'processed' | 'ignored' | 'failed' | 'rejected', lastError?: string) {
    await supabase!.from('integration_webhook_events').upsert({
      ...baseEvent,
      status,
      last_error: lastError ?? null,
      next_retry_at: status === 'failed' ? nextRetryAt(attempts) : null,
      processed_at: status === 'processed' || status === 'ignored' ? new Date().toISOString() : null,
    }, { onConflict: 'provider,idempotency_key' })
  }

  if (!signatureValid || !merchantMatches) {
    await saveEvent('rejected', !signatureValid ? 'Invalid signature' : 'Merchant id mismatch')
    await recordAudit(supabase, { actorId: ownerId, action: 'payfast_webhook_rejected', entityType: 'webhook', metadata: { reason: !signatureValid ? 'invalid_signature' : 'merchant_mismatch', source_ip: sourceIp } })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  if (!sourceVerified) {
    await saveEvent('rejected', 'Payfast server validation failed')
    return NextResponse.json({ error: 'Source validation failed' }, { status: 400 })
  }

  // 4. Apply to the ledger.
  try {
    const result = await processPayfastItn(supabase, payload, { ownerId, mode })
    if (result.outcome === 'failed') {
      await saveEvent('failed', result.message)
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
    await saveEvent(result.outcome === 'ignored' ? 'ignored' : 'processed')
    await supabase.from('integration_connections').update({ last_synced_at: new Date().toISOString(), health_status: 'healthy', last_error: null }).eq('provider', 'payfast').eq('owner_id', ownerId ?? '')
    return new Response(result.message, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Payfast processing error'
    await saveEvent('failed', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
