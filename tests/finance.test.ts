import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateCollectionRate, calculateInvoiceBalance, calculateOwnerStatement, isOverdue } from '../src/lib/finance/calculations.ts'
import { generatePayfastSignature } from '../src/lib/payments/payfast.ts'

test('calculates partial invoice balances', () => {
  assert.equal(calculateInvoiceBalance({ id: 'i1', amount: 1000, dueDate: '2026-09-01', status: 'unpaid' }, [{ invoiceId: 'i1', amount: 250 }]), 750)
})
test('never reports a negative invoice balance after overpayment', () => {
  assert.equal(calculateInvoiceBalance({ id: 'i1', amount: 1000, dueDate: '2026-09-01', status: 'unpaid' }, [{ invoiceId: 'i1', amount: 1250 }]), 0)
})
test('calculates owner statement NOI', () => {
  assert.deepEqual(calculateOwnerStatement(10000, 2500), { income: 10000, expenses: 2500, ownerAmount: 7500, netOperatingIncome: 7500 })
})
test('handles zero expected collections', () => assert.equal(calculateCollectionRate(0, 500), 0))
test('identifies overdue unpaid invoices only', () => {
  assert.equal(isOverdue({ id: 'i1', amount: 1, dueDate: '2026-09-01', status: 'unpaid' }, '2026-10-01'), true)
  assert.equal(isOverdue({ id: 'i2', amount: 1, dueDate: '2026-09-01', status: 'paid' }, '2026-10-01'), false)
})
test('Payfast signatures are deterministic and exclude the signature field', () => {
  const fields = { merchant_id: '10000100', amount: '100.00', m_payment_id: 'invoice-1' }
  assert.equal(generatePayfastSignature(fields), generatePayfastSignature({ ...fields, signature: 'ignored' }))
  assert.notEqual(generatePayfastSignature(fields), generatePayfastSignature({ ...fields, amount: '101.00' }))
})
