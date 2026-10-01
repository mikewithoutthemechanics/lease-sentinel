import type { SupabaseClient } from '@supabase/supabase-js'
import { mapPaymentStatus, parsePayfastItn, type PayfastMode } from '@/lib/payments/payfast'
import { recordAudit } from '@/lib/integrations/connections'

export { mapPaymentStatus }

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ItnOutcome = 'processed' | 'ignored' | 'failed'

export interface ProcessItnResult {
  outcome: ItnOutcome
  message: string
  reconciliationStatus?: string
  invoiceId?: string | null
  paymentId?: string | null
}

export interface ProcessItnContext {
  ownerId: string | null
  mode: PayfastMode
}

/** Recomputes an invoice status from the payments recorded against it. */
export async function syncInvoiceStatus(supabase: SupabaseClient, invoiceId: string) {
  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase.from('invoices').select('id, amount, due_date, status').eq('id', invoiceId).maybeSingle(),
    supabase.from('payments').select('amount, status, refunded_amount').eq('invoice_id', invoiceId),
  ])
  if (!invoice) return null
  const settled = (payments ?? [])
    .filter((payment) => payment.status !== 'failed')
    .reduce((total, payment) => total + Number(payment.amount ?? 0) - Number(payment.refunded_amount ?? 0), 0)
  const today = new Date().toISOString().slice(0, 10)
  const status = settled + 0.005 >= Number(invoice.amount) ? 'paid' : invoice.due_date < today ? 'overdue' : 'unpaid'
  if (status !== invoice.status) await supabase.from('invoices').update({ status }).eq('id', invoiceId)
  return { status, settled }
}

async function invoiceOwnerIds(supabase: SupabaseClient, invoiceId: string) {
  const { data } = await supabase
    .from('invoices')
    .select('id, amount, leases!inner(units!inner(properties!inner(owner_id, manager_id)))')
    .eq('id', invoiceId)
    .maybeSingle()
  if (!data) return null
  type Chain = { units?: { properties?: { owner_id?: string; manager_id?: string } }[] }[]
  const leases = (data as unknown as { leases?: Chain }).leases ?? []
  const property = leases[0]?.units?.[0]?.properties
  return { amount: Number((data as { amount: number }).amount), ownerId: property?.owner_id ?? null, managerId: property?.manager_id ?? null }
}

/**
 * Applies a verified Payfast ITN to the ledger. Safe to call repeatedly: the
 * transaction row is keyed on (owner_id, pf_payment_id) and the payment row on
 * the unique (provider, raw_reference) index.
 */
export async function processPayfastItn(supabase: SupabaseClient, payload: Record<string, string>, context: ProcessItnContext): Promise<ProcessItnResult> {
  const itn = parsePayfastItn(payload)
  if (!itn.pfPaymentId) return { outcome: 'ignored', message: 'Missing pf_payment_id' }
  const ownerId = context.ownerId
  if (!ownerId) return { outcome: 'failed', message: 'No Payfast connection matches this merchant id' }

  const mapping = mapPaymentStatus(itn.paymentStatus)
  const invoiceId = UUID_PATTERN.test(itn.mPaymentId) ? itn.mPaymentId : null
  const invoice = invoiceId ? await invoiceOwnerIds(supabase, invoiceId) : null

  let reconciliationStatus = mapping.ledger
  let message = `Recorded ${itn.paymentStatus || 'UNKNOWN'} transaction`
  if (!invoice) reconciliationStatus = 'unlinked'
  else if (invoice.ownerId !== ownerId && invoice.managerId !== ownerId) return { outcome: 'failed', message: 'Invoice does not belong to the Payfast merchant account' }
  else if (mapping.appliesFunds && Math.abs(Math.round(invoice.amount * 100) - Math.round(itn.amountGross * 100)) > 1) reconciliationStatus = 'amount_mismatch'

  const transactionRow = {
    owner_id: ownerId,
    pf_payment_id: itn.pfPaymentId,
    m_payment_id: itn.mPaymentId || null,
    invoice_id: invoice ? invoiceId : null,
    mode: context.mode,
    payment_status: itn.paymentStatus || 'UNKNOWN',
    amount_gross: itn.amountGross,
    amount_fee: itn.amountFee,
    amount_net: itn.amountNet,
    currency: payload.currency ?? 'ZAR',
    source: 'itn',
    reconciliation_status: reconciliationStatus,
    reconciled_at: reconciliationStatus === 'matched' ? new Date().toISOString() : null,
    raw: payload,
    updated_at: new Date().toISOString(),
  }

  const { data: transaction, error: transactionError } = await supabase
    .from('payfast_transactions')
    .upsert(transactionRow, { onConflict: 'owner_id,pf_payment_id' })
    .select('id, payment_id')
    .single()
  if (transactionError) return { outcome: 'failed', message: transactionError.message }

  let paymentId: string | null = (transaction?.payment_id as string | null) ?? null

  if (reconciliationStatus === 'amount_mismatch') {
    await recordAudit(supabase, { actorId: ownerId, action: 'payfast_amount_mismatch', entityType: 'payfast_transaction', entityId: transaction.id, metadata: { pf_payment_id: itn.pfPaymentId, expected: invoice?.amount, received: itn.amountGross } })
    return { outcome: 'processed', message: 'Amount mismatch flagged for review', reconciliationStatus, invoiceId, paymentId }
  }

  if (mapping.appliesFunds && invoiceId) {
    const { data: existingPayment } = await supabase.from('payments').select('id').eq('provider', 'payfast').eq('raw_reference', itn.pfPaymentId).maybeSingle()
    if (existingPayment) {
      paymentId = existingPayment.id
      message = 'Payment already recorded'
    } else {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: itn.amountGross,
          fee_amount: itn.amountFee,
          net_amount: itn.amountNet,
          payment_method: 'Payfast',
          transaction_id: itn.pfPaymentId,
          provider: 'payfast',
          raw_reference: itn.pfPaymentId,
          status: 'completed',
        })
        .select('id')
        .single()
      if (paymentError && !paymentError.message.toLowerCase().includes('duplicate')) return { outcome: 'failed', message: paymentError.message }
      paymentId = payment?.id ?? null
      if (paymentId) await supabase.from('payment_allocations').upsert({ payment_id: paymentId, invoice_id: invoiceId, amount: itn.amountGross }, { onConflict: 'payment_id,invoice_id' })
      message = 'Payment recorded and invoice updated'
    }
  }

  if (mapping.paymentStatus === 'refunded' && invoiceId) {
    const { data: payment } = await supabase.from('payments').select('id, amount').eq('provider', 'payfast').eq('raw_reference', itn.pfPaymentId).maybeSingle()
    if (payment) {
      paymentId = payment.id
      await supabase.from('payments').update({ status: 'refunded', refunded_amount: Number(payment.amount) }).eq('id', payment.id)
      await supabase.from('payfast_transactions').update({ refunded_amount: Number(payment.amount) }).eq('id', transaction.id)
      message = 'Refund applied and invoice reopened'
    }
  }

  if (paymentId) await supabase.from('payfast_transactions').update({ payment_id: paymentId }).eq('id', transaction.id)
  if (invoiceId && (mapping.appliesFunds || mapping.paymentStatus === 'refunded')) await syncInvoiceStatus(supabase, invoiceId)

  await recordAudit(supabase, { actorId: ownerId, action: `payfast_itn_${itn.paymentStatus.toLowerCase() || 'unknown'}`, entityType: 'payfast_transaction', entityId: transaction.id, metadata: { pf_payment_id: itn.pfPaymentId, invoice_id: invoiceId, amount: itn.amountGross, mode: context.mode } })
  return { outcome: 'processed', message, reconciliationStatus, invoiceId, paymentId }
}
