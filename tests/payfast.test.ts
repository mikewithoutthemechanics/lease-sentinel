import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildPayfastApiHeaders,
  buildPayfastCheckout,
  generatePayfastSignature,
  itnIdempotencyKey,
  mapPaymentStatus,
  parsePayfastItn,
  payfastApiUrl,
  payfastProcessUrl,
  reconcileTransactions,
  retryDelayMinutes,
  verifyPayfastSignature,
} from '../src/lib/payments/payfast.ts'
import { decryptSecret, encryptSecret, isEncryptedSecret, maskSecret, readSecret } from '../src/lib/integrations/crypto.ts'

const KEY = Buffer.alloc(32, 7).toString('base64')

test('sandbox and live modes target the correct Payfast hosts', () => {
  assert.equal(payfastProcessUrl('sandbox'), 'https://sandbox.payfast.co.za/eng/process')
  assert.equal(payfastProcessUrl('live'), 'https://www.payfast.co.za/eng/process')
  assert.match(payfastApiUrl('/ping', 'sandbox'), /^https:\/\/api\.payfast\.co\.za\/ping\?testing=true$/)
  assert.equal(payfastApiUrl('/ping', 'live'), 'https://api.payfast.co.za/ping')
})

test('checkout fields are signed with the merchant passphrase and point at the notify URL', () => {
  const checkout = buildPayfastCheckout(
    { id: '11111111-1111-4111-8111-111111111111', amount: 1234.5, invoice_number: 'INV-001' },
    { full_name: 'Thandi Mokoena', email: 'thandi@example.co.za' },
    { credentials: { merchantId: '10000100', merchantKey: '46f0cd694581a', passphrase: 'salty', mode: 'sandbox' }, siteUrl: 'https://app.leasesentinel.co.za' },
  )
  assert.equal(checkout.action, 'https://sandbox.payfast.co.za/eng/process')
  assert.equal(checkout.fields.amount, '1234.50')
  assert.equal(checkout.fields.notify_url, 'https://app.leasesentinel.co.za/api/payfast/notify')
  assert.equal(checkout.fields.signature, generatePayfastSignature({ ...checkout.fields, signature: undefined }, 'salty'))
})

test('ITN signature verification accepts a valid payload and rejects tampering', () => {
  const payload: Record<string, string> = { m_payment_id: 'inv-1', pf_payment_id: '1089250', payment_status: 'COMPLETE', amount_gross: '200.00', amount_fee: '-4.60', amount_net: '195.40', merchant_id: '10000100' }
  payload.signature = generatePayfastSignature(payload, 'salty')
  assert.equal(verifyPayfastSignature(payload, 'salty'), true)
  assert.equal(verifyPayfastSignature({ ...payload, amount_gross: '2000.00' }, 'salty'), false)
  assert.equal(verifyPayfastSignature(payload, 'wrong-passphrase'), false)
  assert.equal(verifyPayfastSignature({ ...payload, signature: '' }), false)
})

test('ITN parsing normalises the Payfast fee sign and status casing', () => {
  const itn = parsePayfastItn({ pf_payment_id: '1089250', m_payment_id: 'inv-1', payment_status: 'complete', amount_gross: '200.00', amount_fee: '-4.60', amount_net: '195.40', merchant_id: '10000100' })
  assert.equal(itn.paymentStatus, 'COMPLETE')
  assert.equal(itn.amountFee, 4.6)
  assert.equal(itn.amountNet, 195.4)
})

test('idempotency keys are stable per transaction state and change with the status', () => {
  const base = { merchant_id: '10000100', pf_payment_id: '1089250', payment_status: 'COMPLETE', amount_gross: '200.00' }
  assert.equal(itnIdempotencyKey(base), itnIdempotencyKey({ ...base, signature: 'anything' }))
  assert.notEqual(itnIdempotencyKey(base), itnIdempotencyKey({ ...base, payment_status: 'REFUNDED' }))
})

test('API headers sign merchant-id, version and timestamp with the passphrase', () => {
  const headers = buildPayfastApiHeaders({ merchantId: '10000100', merchantKey: 'key', passphrase: 'salty', mode: 'sandbox' }, {}, '2026-10-01T09:00:00')
  assert.equal(headers.version, 'v1')
  assert.equal(headers.signature, generatePayfastSignature({ 'merchant-id': '10000100', version: 'v1', timestamp: '2026-10-01T09:00:00' }, 'salty'))
})

test('payment status mapping only applies funds on COMPLETE', () => {
  assert.deepEqual(mapPaymentStatus('COMPLETE'), { ledger: 'matched', paymentStatus: 'completed', appliesFunds: true })
  assert.equal(mapPaymentStatus('PENDING').appliesFunds, false)
  assert.equal(mapPaymentStatus('FAILED').paymentStatus, 'failed')
  assert.equal(mapPaymentStatus('refunded').ledger, 'refunded')
})

test('two-way reconciliation reports both directions and amount mismatches', () => {
  const result = reconcileTransactions(
    [
      { pfPaymentId: 'A', amountGross: 100 },
      { pfPaymentId: 'B', amountGross: 250.01 },
      { pfPaymentId: 'C', amountGross: 75 },
    ],
    [
      { pfPaymentId: 'A', amountGross: 100 },
      { pfPaymentId: 'B', amountGross: 300 },
      { pfPaymentId: 'D', mPaymentId: 'inv-9', amountGross: 42 },
    ],
  )
  assert.deepEqual(result.matched.map(item => item.pfPaymentId), ['A'])
  assert.deepEqual(result.amountMismatches, [{ pfPaymentId: 'B', localAmount: 250.01, remoteAmount: 300 }])
  assert.deepEqual(result.missingAtPayfast.map(item => item.pfPaymentId), ['C'])
  assert.deepEqual(result.missingLocally.map(item => item.pfPaymentId), ['D'])
})

test('reconciliation tolerates sub-cent rounding differences', () => {
  const result = reconcileTransactions([{ pfPaymentId: 'A', amountGross: 100.004 }], [{ pfPaymentId: 'A', amountGross: 100 }])
  assert.equal(result.matched.length, 1)
  assert.equal(result.amountMismatches.length, 0)
})

test('retry backoff grows and is capped at an hour', () => {
  assert.deepEqual([1, 2, 3, 4].map(retryDelayMinutes), [1, 2, 4, 8])
  assert.equal(retryDelayMinutes(20), 60)
})

test('integration secrets round-trip through AES-256-GCM and are tamper evident', () => {
  const secret = encryptSecret('my-payfast-passphrase', KEY)
  assert.equal(isEncryptedSecret(secret), true)
  assert.notEqual(secret.data, 'my-payfast-passphrase')
  assert.equal(decryptSecret(secret, KEY), 'my-payfast-passphrase')
  assert.equal(readSecret({ ...secret, data: encryptSecret('other', KEY).data }, KEY), undefined)
  assert.equal(readSecret('plain-text', KEY), undefined)
})

test('encryption rejects keys that are not 32 bytes', () => {
  assert.throws(() => encryptSecret('x', Buffer.alloc(16, 1).toString('base64')), /32 bytes/)
})

test('masking never reveals more than the last characters of a secret', () => {
  assert.equal(maskSecret('46f0cd694581a'), '••••••••581a')
  assert.equal(maskSecret(''), '')
})
