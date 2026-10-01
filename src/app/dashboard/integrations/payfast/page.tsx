'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Link2Off, RefreshCw, RotateCcw, ShieldCheck, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ConnectionView = {
  id: string
  status: string
  mode: 'sandbox' | 'live'
  merchantId: string
  merchantKeyMask: string
  passphraseSet: boolean
  healthStatus: string
  lastHealthCheckAt: string | null
  lastSyncedAt: string | null
  lastError: string | null
} | null

type Transaction = {
  id: string
  pf_payment_id: string
  m_payment_id: string | null
  invoice_id: string | null
  payment_status: string
  amount_gross: number
  amount_fee: number
  amount_net: number
  refunded_amount: number
  reconciliation_status: string
  source: string
  transaction_date: string
}

type WebhookEvent = {
  id: string
  event_type: string
  external_id: string | null
  status: string
  attempts: number
  signature_valid: boolean
  source_verified: boolean
  last_error: string | null
  created_at: string
}

type SyncRun = { id: string; kind: string; status: string; stats: Record<string, unknown>; error: string | null; started_at: string; finished_at: string | null }

type PayfastData = {
  connection: ConnectionView
  transactions: Transaction[]
  webhooks: WebhookEvent[]
  syncRuns: SyncRun[]
  summary: { total: number; matched: number; exceptions: number; grossCollected: number; feesPaid: number }
}

const zar = (value: number) => `R ${Number(value || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const date = (value?: string | null) => (value ? new Date(value).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

const reconciliationStyles: Record<string, string> = {
  matched: 'bg-emerald-50 text-emerald-700',
  refunded: 'bg-slate-100 text-slate-600',
  amount_mismatch: 'bg-red-50 text-red-700',
  missing_locally: 'bg-amber-50 text-amber-700',
  missing_at_payfast: 'bg-amber-50 text-amber-700',
  unlinked: 'bg-violet-50 text-violet-700',
  unreconciled: 'bg-slate-100 text-slate-600',
}

const healthStyles: Record<string, string> = { healthy: 'text-emerald-600', degraded: 'text-amber-600', failing: 'text-red-600', unknown: 'text-slate-400' }

function monthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10)
}

export default function PayfastIntegrationPage() {
  const [data, setData] = useState<PayfastData | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')
  const [form, setForm] = useState({ merchantId: '', merchantKey: '', passphrase: '', mode: 'sandbox' as 'sandbox' | 'live' })
  const [range, setRange] = useState({ from: monthStart(), to: new Date().toISOString().slice(0, 10) })

  const load = useCallback(async () => {
    const response = await fetch('/api/integrations/payfast')
    if (!response.ok) { setMessage((await response.json()).error ?? 'Could not load Payfast data'); return }
    const payload = await response.json() as PayfastData
    setData(payload)
    if (payload.connection) setForm(current => ({ ...current, merchantId: payload.connection!.merchantId, mode: payload.connection!.mode }))
  }, [])

  // Fetch after mount (deferred so state updates never happen synchronously in the effect body).
  useEffect(() => { Promise.resolve().then(load) }, [load])

  async function post(body: Record<string, unknown>, label: string) {
    setBusy(label)
    try {
      const response = await fetch('/api/integrations/payfast', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const result = await response.json()
      setMessage(response.ok ? successMessage(body.action as string, result) : result.error ?? 'Request failed')
      await load()
      return response.ok
    } finally {
      setBusy('')
    }
  }

  function successMessage(action: string, result: Record<string, unknown>) {
    if (action === 'save-settings') return 'Payfast settings saved and encrypted.'
    if (action === 'health-check') return 'Payfast credentials verified.'
    if (action === 'reconcile') { const stats = result.stats as Record<string, number>; return `Reconciled ${stats.remote} Payfast and ${stats.local} local transactions · ${stats.matched} matched, ${stats.mismatched + stats.missingLocally + stats.missingAtPayfast} exceptions.` }
    if (action === 'retry-webhook') return String(result.message ?? 'Webhook replayed.')
    if (action === 'refund') return `Refund submitted. Transaction is now ${String(result.status).replace('_', ' ')}.`
    if (action === 'disconnect') return result.purged ? 'Payfast disconnected and transaction data removed.' : 'Payfast disconnected. Credentials erased.'
    return 'Done.'
  }

  function saveSettings(event: FormEvent) {
    event.preventDefault()
    post({ action: 'save-settings', merchantId: form.merchantId, merchantKey: form.merchantKey || undefined, passphrase: form.passphrase || undefined, mode: form.mode }, 'save')
      .then(ok => { if (ok) setForm(current => ({ ...current, merchantKey: '', passphrase: '' })) })
  }

  const connection = data?.connection ?? null
  const summary = data?.summary

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="flex h-[72px] items-center border-b border-slate-200 bg-white px-5 md:px-8">
        <Link href="/dashboard/integrations" className="mr-3 rounded-lg p-2 text-slate-500"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <p className="text-xs text-slate-400">Integrations / Payfast</p>
          <h1 className="text-lg font-bold">Payfast payments &amp; reconciliation</h1>
        </div>
        <span className={`flex items-center gap-2 text-xs font-bold ${healthStyles[connection?.healthStatus ?? 'unknown']}`}>
          <Activity size={14} /> {connection?.healthStatus === 'healthy' ? 'Healthy' : connection?.healthStatus === 'failing' ? 'Failing' : connection?.healthStatus === 'degraded' ? 'Degraded' : 'Not checked'}
        </span>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 md:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Transactions', value: String(summary?.total ?? 0) },
            { label: 'Matched', value: String(summary?.matched ?? 0) },
            { label: 'Exceptions', value: String(summary?.exceptions ?? 0) },
            { label: 'Collected (gross)', value: zar(summary?.grossCollected ?? 0) },
          ].map(card => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <form onSubmit={saveSettings} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#287366]" />
              <h2 className="font-bold">Merchant connection</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">Merchant key and passphrase are encrypted with AES-256-GCM before storage and never returned to the browser.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="merchantId">Merchant ID</Label>
                <Input id="merchantId" value={form.merchantId} onChange={event => setForm({ ...form, merchantId: event.target.value })} placeholder="10000100" required />
              </div>
              <div>
                <Label htmlFor="mode">Environment</Label>
                <select id="mode" value={form.mode} onChange={event => setForm({ ...form, mode: event.target.value as 'sandbox' | 'live' })} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm">
                  <option value="sandbox">Sandbox (testing)</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div>
                <Label htmlFor="merchantKey">Merchant key {connection?.merchantKeyMask && <span className="text-xs font-normal text-slate-400">· stored {connection.merchantKeyMask}</span>}</Label>
                <Input id="merchantKey" value={form.merchantKey} onChange={event => setForm({ ...form, merchantKey: event.target.value })} placeholder={connection?.merchantKeyMask ? 'Leave blank to keep' : '46f0cd694581a'} type="password" />
              </div>
              <div>
                <Label htmlFor="passphrase">Passphrase {connection?.passphraseSet && <span className="text-xs font-normal text-slate-400">· stored</span>}</Label>
                <Input id="passphrase" value={form.passphrase} onChange={event => setForm({ ...form, passphrase: event.target.value })} placeholder={connection?.passphraseSet ? 'Leave blank to keep' : 'Salt used for signatures'} type="password" />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy === 'save'} className="rounded-lg bg-[#193b37] text-xs text-white">{busy === 'save' ? 'Saving…' : 'Save settings'}</Button>
              <Button type="button" variant="outline" disabled={busy === 'health'} onClick={() => post({ action: 'health-check' }, 'health')} className="rounded-lg text-xs"><Activity size={14} className="mr-1" /> Test connection</Button>
              {connection && (
                <Button type="button" variant="outline" disabled={busy === 'disconnect'} onClick={() => { if (confirm('Disconnect Payfast and erase stored credentials? Tick OK then confirm the next prompt to also delete reconciliation data.')) post({ action: 'disconnect', purge: confirm('Also delete stored Payfast transactions and webhook logs?') }, 'disconnect') }} className="rounded-lg text-xs text-red-600"><Link2Off size={14} className="mr-1" /> Disconnect</Button>
              )}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div><dt className="font-semibold text-slate-400">Status</dt><dd className="capitalize">{connection?.status ?? 'not connected'}</dd></div>
              <div><dt className="font-semibold text-slate-400">Last health check</dt><dd>{date(connection?.lastHealthCheckAt)}</dd></div>
              <div><dt className="font-semibold text-slate-400">Last sync</dt><dd>{date(connection?.lastSyncedAt)}</dd></div>
              <div><dt className="font-semibold text-slate-400">Notify URL</dt><dd className="truncate">/api/payfast/notify</dd></div>
            </dl>
            {connection?.lastError && <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700"><AlertTriangle size={14} className="mt-px shrink-0" /> {connection.lastError}</p>}
          </form>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">Two-way reconciliation</h2>
              <p className="mt-1 text-xs text-slate-500">Pulls the Payfast transaction history and compares it against the payments recorded in Lease Sentinel, in both directions.</p>
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={range.from} onChange={event => setRange({ ...range, from: event.target.value })} /></div>
                <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={range.to} onChange={event => setRange({ ...range, to: event.target.value })} /></div>
                <Button disabled={busy === 'reconcile'} onClick={() => post({ action: 'reconcile', from: range.from, to: range.to }, 'reconcile')} className="rounded-lg bg-[#193b37] text-xs text-white"><RefreshCw size={14} className={`mr-1 ${busy === 'reconcile' ? 'animate-spin' : ''}`} /> Run reconciliation</Button>
              </div>
              <div className="mt-4 space-y-2">
                {(data?.syncRuns ?? []).slice(0, 4).map(run => (
                  <div key={run.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-xs">
                    <span className={`h-2 w-2 rounded-full ${run.status === 'succeeded' ? 'bg-emerald-500' : run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="flex-1 capitalize">{run.kind.replaceAll('_', ' ')} · {run.status}</span>
                    <span className="text-[10px] text-slate-400">{date(run.started_at)}</span>
                  </div>
                ))}
                {!data?.syncRuns.length && <p className="py-3 text-xs text-slate-400">No sync runs yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-bold">Webhook log</h2>
              <p className="mt-1 text-xs text-slate-500">Every ITN is signature checked, confirmed with Payfast and stored with an idempotency key.</p>
              <div className="mt-4 space-y-2">
                {(data?.webhooks ?? []).slice(0, 6).map(event => (
                  <div key={event.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold">{event.event_type} · {event.external_id ?? 'no reference'}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-400">{date(event.created_at)} · {event.attempts} attempt(s) · signature {event.signature_valid ? 'valid' : 'invalid'}{event.last_error ? ` · ${event.last_error}` : ''}</span>
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${event.status === 'processed' ? 'bg-emerald-50 text-emerald-700' : event.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{event.status}</span>
                    {event.status !== 'processed' && event.signature_valid && (
                      <button onClick={() => post({ action: 'retry-webhook', eventId: event.id }, `retry-${event.id}`)} className="text-[10px] font-bold text-[#287366]"><RotateCcw size={12} className="inline" /> Retry</button>
                    )}
                  </div>
                ))}
                {!data?.webhooks.length && <p className="py-3 text-xs text-slate-400">No Payfast callbacks received yet.</p>}
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">Payfast transactions</h2>
              <p className="mt-1 text-xs text-slate-500">Fees paid this period: {zar(summary?.feesPaid ?? 0)}</p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-2">Date</th><th>Payfast ID</th><th>Invoice</th><th>Status</th><th className="text-right">Gross</th><th className="text-right">Fee</th><th className="text-right">Net</th><th>Reconciliation</th><th />
                </tr>
              </thead>
              <tbody>
                {(data?.transactions ?? []).map(transaction => (
                  <tr key={transaction.id} className="border-t border-slate-100">
                    <td className="py-2 text-slate-500">{date(transaction.transaction_date)}</td>
                    <td className="font-mono text-[11px]">{transaction.pf_payment_id}</td>
                    <td className="font-mono text-[11px] text-slate-500">{transaction.invoice_id ? transaction.invoice_id.slice(0, 8) : '—'}</td>
                    <td>{transaction.payment_status}</td>
                    <td className="text-right">{zar(transaction.amount_gross)}</td>
                    <td className="text-right text-slate-500">{zar(transaction.amount_fee)}</td>
                    <td className="text-right">{zar(transaction.amount_net)}</td>
                    <td><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${reconciliationStyles[transaction.reconciliation_status] ?? 'bg-slate-100 text-slate-600'}`}>{transaction.reconciliation_status.replaceAll('_', ' ')}</span></td>
                    <td className="text-right">
                      {transaction.payment_status === 'COMPLETE' && Number(transaction.refunded_amount) < Number(transaction.amount_gross) && (
                        <button
                          onClick={() => { const amount = prompt(`Refund amount (max ${(Number(transaction.amount_gross) - Number(transaction.refunded_amount)).toFixed(2)})`, (Number(transaction.amount_gross) - Number(transaction.refunded_amount)).toFixed(2)); if (amount) post({ action: 'refund', pfPaymentId: transaction.pf_payment_id, amount: Number(amount) }, `refund-${transaction.id}`) }}
                          className="text-[10px] font-bold text-[#287366]"
                        >
                          <Undo2 size={12} className="inline" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {!data?.transactions.length && <tr><td colSpan={9} className="py-6 text-center text-xs text-slate-400">No Payfast transactions yet. Run a sandbox payment or a reconciliation to populate this ledger.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {message && (
        <button onClick={() => setMessage('')} className="fixed bottom-5 right-5 max-w-sm rounded-xl bg-[#193b37] px-4 py-3 text-left text-sm font-semibold text-white shadow-xl">{message}</button>
      )}
    </main>
  )
}
