import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  finishSyncRun,
  getConnection,
  payfastCredentialsFrom,
  publicConnectionView,
  recordAudit,
  savePayfastConnection,
  startSyncRun,
} from '@/lib/integrations/connections'
import {
  createPayfastRefund,
  fetchPayfastTransactions,
  payfastPing,
  reconcileTransactions,
  type PayfastMode,
} from '@/lib/payments/payfast'
import { processPayfastItn, syncInvoiceStatus } from '@/lib/payments/payfast-itn'

export const dynamic = 'force-dynamic'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function monthStart() { const now = new Date(); return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10) }
function today() { return new Date().toISOString().slice(0, 10) }

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  let admin
  try { admin = createAdminClient() } catch { return NextResponse.json({ error: 'Integration storage is not configured' }, { status: 503 }) }

  const connection = await getConnection(admin, user.id, 'payfast')
  const [{ data: transactions }, { data: events }, { data: runs }] = await Promise.all([
    admin.from('payfast_transactions').select('id, pf_payment_id, m_payment_id, invoice_id, payment_status, amount_gross, amount_fee, amount_net, refunded_amount, reconciliation_status, source, transaction_date').eq('owner_id', user.id).order('transaction_date', { ascending: false }).limit(50),
    admin.from('integration_webhook_events').select('id, event_type, external_id, status, attempts, signature_valid, source_verified, last_error, next_retry_at, created_at').eq('provider', 'payfast').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(25),
    admin.from('integration_sync_runs').select('id, kind, status, stats, error, started_at, finished_at').eq('owner_id', user.id).eq('provider', 'payfast').order('started_at', { ascending: false }).limit(10),
  ])

  const rows = transactions ?? []
  const summary = {
    total: rows.length,
    matched: rows.filter((row) => row.reconciliation_status === 'matched').length,
    exceptions: rows.filter((row) => ['amount_mismatch', 'missing_locally', 'missing_at_payfast', 'unlinked'].includes(row.reconciliation_status)).length,
    grossCollected: rows.filter((row) => row.payment_status === 'COMPLETE').reduce((total, row) => total + Number(row.amount_gross ?? 0), 0),
    feesPaid: rows.reduce((total, row) => total + Number(row.amount_fee ?? 0), 0),
  }

  return NextResponse.json({ connection: publicConnectionView(connection), transactions: rows, webhooks: events ?? [], syncRuns: runs ?? [], summary })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  let admin
  try { admin = createAdminClient() } catch { return NextResponse.json({ error: 'Integration storage is not configured' }, { status: 503 }) }

  const body = await request.json() as Record<string, unknown>
  const action = String(body.action ?? '')

  if (action === 'save-settings') {
    const merchantId = String(body.merchantId ?? '').trim()
    const mode = (body.mode === 'live' ? 'live' : 'sandbox') as PayfastMode
    if (!/^\d{5,10}$/.test(merchantId)) return NextResponse.json({ error: 'Enter a valid Payfast merchant ID' }, { status: 400 })
    try {
      const connection = await savePayfastConnection(admin, {
        ownerId: user.id,
        merchantId,
        merchantKey: body.merchantKey ? String(body.merchantKey).trim() : undefined,
        passphrase: body.passphrase === undefined ? undefined : String(body.passphrase).trim(),
        mode,
      })
      await recordAudit(admin, { actorId: user.id, action: 'payfast_settings_saved', entityType: 'integration', entityId: connection.id, source: 'user', metadata: { mode, merchant_id: merchantId } })
      return NextResponse.json({ connection: publicConnectionView(connection) })
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save Payfast settings' }, { status: 400 })
    }
  }

  const connection = await getConnection(admin, user.id, 'payfast')
  const credentials = payfastCredentialsFrom(connection)

  if (action === 'health-check') {
    if (!credentials) return NextResponse.json({ error: 'Add your Payfast merchant credentials first' }, { status: 400 })
    const runId = await startSyncRun(admin, user.id, 'payfast', 'health_check')
    try {
      await payfastPing(credentials)
      await admin.from('integration_connections').update({ health_status: 'healthy', last_health_check_at: new Date().toISOString(), last_error: null, status: 'connected' }).eq('owner_id', user.id).eq('provider', 'payfast')
      await finishSyncRun(admin, runId, 'succeeded', { mode: credentials.mode })
      return NextResponse.json({ health: 'healthy', mode: credentials.mode })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payfast did not respond'
      await admin.from('integration_connections').update({ health_status: 'failing', last_health_check_at: new Date().toISOString(), last_error: message, status: 'error' }).eq('owner_id', user.id).eq('provider', 'payfast')
      await finishSyncRun(admin, runId, 'failed', { mode: credentials.mode }, message)
      return NextResponse.json({ health: 'failing', error: message }, { status: 400 })
    }
  }

  if (action === 'reconcile') {
    if (!credentials) return NextResponse.json({ error: 'Add your Payfast merchant credentials first' }, { status: 400 })
    const from = typeof body.from === 'string' && body.from ? body.from : monthStart()
    const to = typeof body.to === 'string' && body.to ? body.to : today()
    const runId = await startSyncRun(admin, user.id, 'payfast', 'reconciliation')
    try {
      const remoteRows = await fetchPayfastTransactions(credentials, from, to)
      const { data: localRows } = await admin.from('payfast_transactions').select('id, pf_payment_id, invoice_id, amount_gross').eq('owner_id', user.id).gte('transaction_date', `${from}T00:00:00Z`).lte('transaction_date', `${to}T23:59:59Z`)

      const remote = remoteRows.map((row) => ({ pfPaymentId: String(row.pf_payment_id), mPaymentId: row.m_payment_id ? String(row.m_payment_id) : null, amountGross: Number(row.gross ?? 0) }))
      const local = (localRows ?? []).map((row) => ({ pfPaymentId: row.pf_payment_id as string, invoiceId: row.invoice_id as string | null, amountGross: Number(row.amount_gross ?? 0) }))
      const result = reconcileTransactions(local, remote)

      const stamp = new Date().toISOString()
      // Payfast-side transactions we never saw an ITN for: ingest them now.
      for (const missing of result.missingLocally) {
        const source = remoteRows.find((row) => String(row.pf_payment_id) === missing.pfPaymentId)
        await admin.from('payfast_transactions').upsert({
          owner_id: user.id,
          pf_payment_id: missing.pfPaymentId,
          m_payment_id: missing.mPaymentId,
          mode: credentials.mode,
          payment_status: String(source?.type ?? 'COMPLETE').toUpperCase(),
          amount_gross: missing.amountGross,
          amount_fee: Math.abs(Number(source?.fee ?? 0)),
          amount_net: Number(source?.net ?? missing.amountGross),
          currency: String(source?.currency ?? 'ZAR'),
          source: 'api',
          reconciliation_status: 'missing_locally',
          transaction_date: source?.date ? new Date(String(source.date)).toISOString() : stamp,
          raw: source ?? {},
          updated_at: stamp,
        }, { onConflict: 'owner_id,pf_payment_id' })
      }
      for (const matched of result.matched) await admin.from('payfast_transactions').update({ reconciliation_status: 'matched', reconciled_at: stamp, updated_at: stamp }).eq('owner_id', user.id).eq('pf_payment_id', matched.pfPaymentId)
      for (const mismatch of result.amountMismatches) await admin.from('payfast_transactions').update({ reconciliation_status: 'amount_mismatch', updated_at: stamp }).eq('owner_id', user.id).eq('pf_payment_id', mismatch.pfPaymentId)
      for (const missing of result.missingAtPayfast) await admin.from('payfast_transactions').update({ reconciliation_status: 'missing_at_payfast', updated_at: stamp }).eq('owner_id', user.id).eq('pf_payment_id', missing.pfPaymentId)

      const stats = { from, to, remote: remote.length, local: local.length, matched: result.matched.length, mismatched: result.amountMismatches.length, missingLocally: result.missingLocally.length, missingAtPayfast: result.missingAtPayfast.length }
      await finishSyncRun(admin, runId, result.amountMismatches.length || result.missingLocally.length || result.missingAtPayfast.length ? 'partial' : 'succeeded', stats)
      await admin.from('integration_connections').update({ last_synced_at: stamp, health_status: 'healthy', last_error: null }).eq('owner_id', user.id).eq('provider', 'payfast')
      await recordAudit(admin, { actorId: user.id, action: 'payfast_reconciliation_run', entityType: 'integration', entityId: connection?.id ?? null, source: 'user', metadata: stats })
      return NextResponse.json({ stats, result })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reconciliation failed'
      await finishSyncRun(admin, runId, 'failed', { from, to }, message)
      await admin.from('integration_connections').update({ health_status: 'degraded', last_error: message }).eq('owner_id', user.id).eq('provider', 'payfast')
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'retry-webhook') {
    const { data: event } = await admin.from('integration_webhook_events').select('*').eq('id', String(body.eventId ?? '')).eq('owner_id', user.id).eq('provider', 'payfast').maybeSingle()
    if (!event) return NextResponse.json({ error: 'Webhook event not found' }, { status: 404 })
    if (event.status === 'processed') return NextResponse.json({ status: 'processed', message: 'Already processed' })
    const result = await processPayfastItn(admin, event.payload as Record<string, string>, { ownerId: user.id, mode: (connection?.mode ?? 'sandbox') as PayfastMode })
    await admin.from('integration_webhook_events').update({
      status: result.outcome === 'failed' ? 'failed' : result.outcome === 'ignored' ? 'ignored' : 'processed',
      attempts: (event.attempts ?? 0) + 1,
      last_error: result.outcome === 'failed' ? result.message : null,
      processed_at: result.outcome === 'failed' ? null : new Date().toISOString(),
      next_retry_at: null,
    }).eq('id', event.id)
    return NextResponse.json({ status: result.outcome, message: result.message }, { status: result.outcome === 'failed' ? 400 : 200 })
  }

  if (action === 'refund') {
    if (!credentials) return NextResponse.json({ error: 'Add your Payfast merchant credentials first' }, { status: 400 })
    const pfPaymentId = String(body.pfPaymentId ?? '')
    const { data: transaction } = await admin.from('payfast_transactions').select('*').eq('owner_id', user.id).eq('pf_payment_id', pfPaymentId).maybeSingle()
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    const amount = Number(body.amount ?? transaction.amount_gross)
    const refundable = Number(transaction.amount_gross) - Number(transaction.refunded_amount ?? 0)
    if (!(amount > 0) || amount > refundable + 0.005) return NextResponse.json({ error: `Refund amount must be between 0 and ${refundable.toFixed(2)}` }, { status: 400 })
    try {
      await createPayfastRefund(credentials, pfPaymentId, Math.round(amount * 100), String(body.reason ?? 'Landlord initiated refund'))
      const refunded = Number(transaction.refunded_amount ?? 0) + amount
      const fullyRefunded = refunded + 0.005 >= Number(transaction.amount_gross)
      await admin.from('payfast_transactions').update({ refunded_amount: refunded, reconciliation_status: fullyRefunded ? 'refunded' : transaction.reconciliation_status, updated_at: new Date().toISOString() }).eq('id', transaction.id)
      if (transaction.payment_id) await admin.from('payments').update({ refunded_amount: refunded, status: fullyRefunded ? 'refunded' : 'partially_refunded' }).eq('id', transaction.payment_id)
      if (transaction.invoice_id) await syncInvoiceStatus(admin, transaction.invoice_id as string)
      await recordAudit(admin, { actorId: user.id, action: 'payfast_refund_created', entityType: 'payfast_transaction', entityId: transaction.id, source: 'user', metadata: { pf_payment_id: pfPaymentId, amount } })
      return NextResponse.json({ refunded, status: fullyRefunded ? 'refunded' : 'partially_refunded' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Refund failed'
      await recordAudit(admin, { actorId: user.id, action: 'payfast_refund_failed', entityType: 'payfast_transaction', entityId: transaction.id, source: 'user', metadata: { pf_payment_id: pfPaymentId, error: message } })
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (action === 'disconnect') {
    if (!connection) return NextResponse.json({ error: 'Payfast is not connected' }, { status: 404 })
    const purge = body.purge === true
    await admin.from('integration_connections').update({ status: 'disconnected', credentials: {}, health_status: 'unknown', last_error: null, connected_at: null }).eq('id', connection.id)
    if (purge) {
      await admin.from('payfast_transactions').delete().eq('owner_id', user.id)
      await admin.from('integration_webhook_events').delete().eq('owner_id', user.id).eq('provider', 'payfast')
    }
    await recordAudit(admin, { actorId: user.id, action: 'payfast_disconnected', entityType: 'integration', entityId: connection.id, source: 'user', metadata: { purged: purge } })
    return NextResponse.json({ disconnected: true, purged: purge })
  }

  return NextResponse.json({ error: 'Unknown Payfast action' }, { status: 400 })
}
