import test from 'node:test'
import assert from 'node:assert/strict'
import type { SupabaseClient } from '@supabase/supabase-js'
import { processPayfastItn, syncInvoiceStatus } from '../src/lib/payments/payfast-itn.ts'
import { SupabaseStub, type Row } from './support/supabase-stub.ts'

const OWNER = '22222222-2222-4222-8222-222222222222'
const INVOICE = '11111111-1111-4111-8111-111111111111'

function fixture(invoiceOverrides: Row = {}) {
  return new SupabaseStub({
    invoices: [{
      id: INVOICE,
      amount: 9500,
      due_date: '2026-10-01',
      status: 'unpaid',
      leases: [{ tenant_id: 'tenant-1', units: [{ properties: { owner_id: OWNER, manager_id: null } }] }],
      ...invoiceOverrides,
    }],
    payments: [],
    payment_allocations: [],
    payfast_transactions: [],
    audit_events: [],
  })
}

function itn(overrides: Record<string, string> = {}) {
  return { pf_payment_id: '1089250', m_payment_id: INVOICE, payment_status: 'COMPLETE', amount_gross: '9500.00', amount_fee: '-218.50', amount_net: '9281.50', merchant_id: '10000100', ...overrides }
}

const client = (stub: SupabaseStub) => stub as unknown as SupabaseClient

test('a COMPLETE ITN records the payment, fee split and marks the invoice paid', async () => {
  const stub = fixture()
  const result = await processPayfastItn(client(stub), itn(), { ownerId: OWNER, mode: 'sandbox' })

  assert.equal(result.outcome, 'processed')
  assert.equal(result.reconciliationStatus, 'matched')
  assert.equal(stub.rows('payments').length, 1)
  assert.equal(stub.rows('payments')[0].amount, 9500)
  assert.equal(stub.rows('payments')[0].fee_amount, 218.5)
  assert.equal(stub.rows('payments')[0].net_amount, 9281.5)
  assert.equal(stub.rows('payment_allocations').length, 1)
  assert.equal(stub.rows('invoices')[0].status, 'paid')
  assert.equal(stub.rows('payfast_transactions')[0].reconciliation_status, 'matched')
  assert.equal(stub.rows('payfast_transactions')[0].payment_id, stub.rows('payments')[0].id)
  assert.ok(stub.rows('audit_events').some(event => event.action === 'payfast_itn_complete'))
})

test('replaying the same ITN never duplicates the payment', async () => {
  const stub = fixture()
  await processPayfastItn(client(stub), itn(), { ownerId: OWNER, mode: 'sandbox' })
  const second = await processPayfastItn(client(stub), itn(), { ownerId: OWNER, mode: 'sandbox' })

  assert.equal(second.message, 'Payment already recorded')
  assert.equal(stub.rows('payments').length, 1)
  assert.equal(stub.rows('payfast_transactions').length, 1)
})

test('an amount mismatch is flagged instead of recording funds', async () => {
  const stub = fixture()
  const result = await processPayfastItn(client(stub), itn({ amount_gross: '950.00' }), { ownerId: OWNER, mode: 'sandbox' })

  assert.equal(result.reconciliationStatus, 'amount_mismatch')
  assert.equal(stub.rows('payments').length, 0)
  assert.equal(stub.rows('invoices')[0].status, 'unpaid')
  assert.ok(stub.rows('audit_events').some(event => event.action === 'payfast_amount_mismatch'))
})

test('a transaction for another merchant account is refused', async () => {
  const stub = fixture()
  const result = await processPayfastItn(client(stub), itn(), { ownerId: 'someone-else', mode: 'sandbox' })

  assert.equal(result.outcome, 'failed')
  assert.match(result.message, /does not belong/)
  assert.equal(stub.rows('payments').length, 0)
})

test('an ITN without a known invoice is stored as unlinked rather than dropped', async () => {
  const stub = fixture()
  const result = await processPayfastItn(client(stub), itn({ m_payment_id: 'not-a-uuid' }), { ownerId: OWNER, mode: 'sandbox' })

  assert.equal(result.outcome, 'processed')
  assert.equal(result.reconciliationStatus, 'unlinked')
  assert.equal(stub.rows('payfast_transactions')[0].reconciliation_status, 'unlinked')
  assert.equal(stub.rows('payments').length, 0)
})

test('PENDING and FAILED notifications are ledgered without paying the invoice', async () => {
  for (const status of ['PENDING', 'FAILED', 'CANCELLED']) {
    const stub = fixture()
    const result = await processPayfastItn(client(stub), itn({ payment_status: status }), { ownerId: OWNER, mode: 'sandbox' })
    assert.equal(result.outcome, 'processed')
    assert.equal(stub.rows('payments').length, 0, `${status} should not create a payment`)
    assert.equal(stub.rows('invoices')[0].status, 'unpaid')
  }
})

test('a REFUNDED notification reopens the invoice and records the refund', async () => {
  const stub = fixture()
  await processPayfastItn(client(stub), itn(), { ownerId: OWNER, mode: 'sandbox' })
  assert.equal(stub.rows('invoices')[0].status, 'paid')

  const refund = await processPayfastItn(client(stub), itn({ payment_status: 'REFUNDED' }), { ownerId: OWNER, mode: 'sandbox' })

  assert.equal(refund.outcome, 'processed')
  assert.equal(stub.rows('payments')[0].status, 'refunded')
  assert.equal(stub.rows('payments')[0].refunded_amount, 9500)
  assert.equal(stub.rows('invoices')[0].status, 'unpaid')
  assert.equal(stub.rows('payfast_transactions')[0].reconciliation_status, 'refunded')
})

test('invoice status sync ignores failed payments and nets off refunds', async () => {
  const stub = new SupabaseStub({
    invoices: [{ id: INVOICE, amount: 1000, due_date: '2099-01-01', status: 'unpaid' }],
    payments: [
      { id: 'p1', invoice_id: INVOICE, amount: 400, status: 'completed', refunded_amount: 0 },
      { id: 'p2', invoice_id: INVOICE, amount: 600, status: 'failed', refunded_amount: 0 },
    ],
  })
  const partial = await syncInvoiceStatus(client(stub), INVOICE)
  assert.equal(partial?.settled, 400)
  assert.equal(stub.rows('invoices')[0].status, 'unpaid')

  stub.rows('payments').push({ id: 'p3', invoice_id: INVOICE, amount: 600, status: 'completed', refunded_amount: 0 })
  const settled = await syncInvoiceStatus(client(stub), INVOICE)
  assert.equal(settled?.status, 'paid')
})
