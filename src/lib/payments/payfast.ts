import crypto from 'crypto'

/** Constant-time comparison (local copy so this module stays dependency free). */
function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}

type PayfastFields = Record<string, string | number | undefined>

export type PayfastMode = 'sandbox' | 'live'

export interface PayfastCredentials {
  merchantId: string
  merchantKey: string
  passphrase?: string
  mode: PayfastMode
}

export const PAYFAST_HOSTS: Record<PayfastMode, string> = { sandbox: 'sandbox.payfast.co.za', live: 'www.payfast.co.za' }

/** Hostnames Payfast posts ITN callbacks from. Used as a defence-in-depth source check. */
export const PAYFAST_ITN_HOSTS = ['www.payfast.co.za', 'sandbox.payfast.co.za', 'w1w.payfast.co.za', 'w2w.payfast.co.za']

export function payfastProcessUrl(mode: PayfastMode) {
  return `https://${PAYFAST_HOSTS[mode]}/eng/process`
}

export function payfastValidateUrl(mode: PayfastMode) {
  return `https://${PAYFAST_HOSTS[mode]}/eng/query/validate`
}

/** The Payfast REST API always lives on api.payfast.co.za; sandbox adds ?testing=true. */
export function payfastApiUrl(path: string, mode: PayfastMode, query: Record<string, string> = {}) {
  const url = new URL(`https://api.payfast.co.za${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query)) if (value) url.searchParams.set(key, value)
  if (mode === 'sandbox') url.searchParams.set('testing', 'true')
  return url.toString()
}

function encodeValue(value: string) {
  return encodeURIComponent(value.trim()).replace(/%20/g, '+')
}

/**
 * Payfast form/ITN signature: alphabetised non-empty fields, URL encoded with
 * '+' for spaces, passphrase appended last, MD5 hashed.
 */
export function generatePayfastSignature(data: PayfastFields, passPhrase?: string) {
  let queryString = Object.keys(data)
    .filter((key) => data[key] !== '' && data[key] !== undefined && key !== 'signature')
    .sort()
    .map((key) => `${key}=${encodeValue(String(data[key]))}`)
    .join('&')

  if (passPhrase) queryString += `&passphrase=${encodeValue(passPhrase)}`
  return crypto.createHash('md5').update(queryString).digest('hex')
}

/** Verifies an ITN payload signature in constant time. */
export function verifyPayfastSignature(data: Record<string, string>, passPhrase?: string) {
  const provided = data.signature
  if (!provided) return false
  return safeEqual(generatePayfastSignature(data, passPhrase).toLowerCase(), provided.toLowerCase())
}

/**
 * Payfast REST API signature: alphabetised headers + body/query params +
 * passphrase, MD5 hashed. The `testing` flag is excluded.
 */
export function buildPayfastApiHeaders(credentials: PayfastCredentials, params: Record<string, string | number> = {}, timestamp = new Date().toISOString().split('.')[0]) {
  const signatureFields: PayfastFields = { 'merchant-id': credentials.merchantId, version: 'v1', timestamp, ...params }
  const signature = generatePayfastSignature(signatureFields, credentials.passphrase)
  return { 'merchant-id': credentials.merchantId, version: 'v1', timestamp, signature, 'content-type': 'application/json' }
}

export interface PayfastItn {
  pfPaymentId: string
  mPaymentId: string
  paymentStatus: string
  amountGross: number
  amountFee: number
  amountNet: number
  merchantId: string
  itemName?: string
  emailAddress?: string
  raw: Record<string, string>
}

export function parsePayfastItn(data: Record<string, string>): PayfastItn {
  return {
    pfPaymentId: data.pf_payment_id ?? '',
    mPaymentId: data.m_payment_id ?? '',
    paymentStatus: (data.payment_status ?? '').toUpperCase(),
    amountGross: Number(data.amount_gross ?? 0),
    amountFee: Math.abs(Number(data.amount_fee ?? 0)),
    amountNet: Number(data.amount_net ?? 0),
    merchantId: data.merchant_id ?? '',
    itemName: data.item_name,
    emailAddress: data.email_address,
    raw: data,
  }
}

/** Stable key so a replayed ITN is never processed twice. */
export function itnIdempotencyKey(data: Record<string, string>) {
  const basis = `${data.merchant_id ?? ''}:${data.pf_payment_id ?? ''}:${(data.payment_status ?? '').toUpperCase()}:${data.amount_gross ?? ''}`
  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 48)
}

/** Posts the payload back to Payfast; only Payfast can confirm it sent the data. */
export async function validateItnWithPayfast(data: Record<string, string>, mode: PayfastMode, fetchImpl: typeof fetch = fetch) {
  const body = new URLSearchParams(data).toString()
  const response = await fetchImpl(payfastValidateUrl(mode), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  if (!response.ok) return false
  return (await response.text()).trim().toUpperCase().startsWith('VALID')
}

export interface PayfastInvoice { id: string; amount: number; invoice_number: string }
export interface PayfastUser { full_name?: string; email: string }

export interface PayfastFormOptions {
  credentials: PayfastCredentials
  siteUrl: string
}

/** Builds the signed checkout fields a tenant posts to Payfast. */
export function buildPayfastCheckout(invoice: PayfastInvoice, user: PayfastUser, options: PayfastFormOptions) {
  const data: PayfastFields = {
    merchant_id: options.credentials.merchantId,
    merchant_key: options.credentials.merchantKey,
    return_url: `${options.siteUrl}/payments/success`,
    cancel_url: `${options.siteUrl}/payments/cancel`,
    notify_url: `${options.siteUrl}/api/payfast/notify`,
    name_first: user.full_name?.split(' ')[0] || 'Tenant',
    email_address: user.email,
    m_payment_id: invoice.id,
    amount: invoice.amount.toFixed(2),
    item_name: `Lease Payment: ${invoice.invoice_number}`,
  }
  const fields: Record<string, string> = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))
  fields.signature = generatePayfastSignature(data, options.credentials.passphrase)
  return { action: payfastProcessUrl(options.credentials.mode), fields }
}

/** Backwards-compatible environment-variable form builder. */
export function getPayfastForm(invoice: PayfastInvoice, user: PayfastUser) {
  const credentials: PayfastCredentials = {
    merchantId: process.env.PAYFAST_MERCHANT_ID ?? '',
    merchantKey: process.env.PAYFAST_MERCHANT_KEY ?? '',
    passphrase: process.env.PAYFAST_PASSPHRASE,
    mode: (process.env.PAYFAST_MODE as PayfastMode) || 'sandbox',
  }
  return buildPayfastCheckout(invoice, user, { credentials, siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? '' }).fields
}

// ---------------------------------------------------------------------------
// Payfast REST API calls
// ---------------------------------------------------------------------------

export interface PayfastApiTransaction {
  pf_payment_id: string
  m_payment_id?: string
  gross?: number | string
  fee?: number | string
  net?: number | string
  date?: string
  type?: string
  currency?: string
  [key: string]: unknown
}

async function payfastApiRequest(url: string, credentials: PayfastCredentials, init: RequestInit & { params?: Record<string, string | number> } = {}, fetchImpl: typeof fetch = fetch) {
  const headers = buildPayfastApiHeaders(credentials, init.params ?? {})
  const response = await fetchImpl(url, { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) } })
  const text = await response.text()
  if (!response.ok) throw new Error(`Payfast API ${response.status}: ${text.slice(0, 200) || 'no response body'}`)
  try { return text ? JSON.parse(text) : null } catch { return text }
}

/** Lightweight credential check used by the connection health check. */
export async function payfastPing(credentials: PayfastCredentials, fetchImpl: typeof fetch = fetch) {
  await payfastApiRequest(payfastApiUrl('/ping', credentials.mode), credentials, { method: 'GET' }, fetchImpl)
  return true
}

export async function fetchPayfastTransactions(credentials: PayfastCredentials, from: string, to: string, fetchImpl: typeof fetch = fetch): Promise<PayfastApiTransaction[]> {
  const result = await payfastApiRequest(payfastApiUrl('/transactions/history', credentials.mode, { from, to }), credentials, { method: 'GET', params: { from, to } }, fetchImpl)
  const rows = Array.isArray(result) ? result : Array.isArray((result as { data?: unknown })?.data) ? (result as { data: PayfastApiTransaction[] }).data : []
  return rows.filter((row): row is PayfastApiTransaction => Boolean(row && typeof row === 'object'))
}

export async function createPayfastRefund(credentials: PayfastCredentials, pfPaymentId: string, amountCents: number, reason: string, fetchImpl: typeof fetch = fetch) {
  const params = { amount: amountCents, reason, notify_buyer: 1 }
  return payfastApiRequest(payfastApiUrl(`/refunds/${pfPaymentId}`, credentials.mode), credentials, { method: 'POST', params, body: JSON.stringify(params) }, fetchImpl)
}

// ---------------------------------------------------------------------------
// Two-way reconciliation (pure, unit-tested)
// ---------------------------------------------------------------------------

export interface LocalPayfastRecord { pfPaymentId: string; invoiceId?: string | null; amountGross: number }
export interface RemotePayfastRecord { pfPaymentId: string; mPaymentId?: string | null; amountGross: number }

export interface ReconciliationResult {
  matched: Array<{ pfPaymentId: string; amountGross: number }>
  amountMismatches: Array<{ pfPaymentId: string; localAmount: number; remoteAmount: number }>
  missingLocally: RemotePayfastRecord[]
  missingAtPayfast: LocalPayfastRecord[]
}

/** Compares the local Payfast ledger against Payfast's own transaction history. */
export function reconcileTransactions(local: LocalPayfastRecord[], remote: RemotePayfastRecord[], toleranceCents = 1): ReconciliationResult {
  const remoteById = new Map(remote.map((item) => [item.pfPaymentId, item]))
  const localById = new Map(local.map((item) => [item.pfPaymentId, item]))
  const result: ReconciliationResult = { matched: [], amountMismatches: [], missingLocally: [], missingAtPayfast: [] }

  for (const localRecord of local) {
    const remoteRecord = remoteById.get(localRecord.pfPaymentId)
    if (!remoteRecord) { result.missingAtPayfast.push(localRecord); continue }
    if (Math.abs(Math.round(localRecord.amountGross * 100) - Math.round(remoteRecord.amountGross * 100)) > toleranceCents) {
      result.amountMismatches.push({ pfPaymentId: localRecord.pfPaymentId, localAmount: localRecord.amountGross, remoteAmount: remoteRecord.amountGross })
      continue
    }
    result.matched.push({ pfPaymentId: localRecord.pfPaymentId, amountGross: remoteRecord.amountGross })
  }
  for (const remoteRecord of remote) if (!localById.has(remoteRecord.pfPaymentId)) result.missingLocally.push(remoteRecord)
  return result
}

/**
 * Decides the ledger state for a Payfast payment status. Pure so the state
 * machine can be unit tested without a database.
 */
export function mapPaymentStatus(payfastStatus: string): { ledger: string; paymentStatus: string | null; appliesFunds: boolean } {
  switch (payfastStatus.toUpperCase()) {
    case 'COMPLETE': return { ledger: 'matched', paymentStatus: 'completed', appliesFunds: true }
    case 'REFUNDED': return { ledger: 'refunded', paymentStatus: 'refunded', appliesFunds: false }
    case 'PENDING': return { ledger: 'unreconciled', paymentStatus: 'pending', appliesFunds: false }
    case 'FAILED':
    case 'CANCELLED': return { ledger: 'unreconciled', paymentStatus: 'failed', appliesFunds: false }
    default: return { ledger: 'unreconciled', paymentStatus: null, appliesFunds: false }
  }
}

/** Exponential backoff schedule for failed webhook deliveries (minutes). */
export function retryDelayMinutes(attempt: number) {
  return Math.min(60, 2 ** Math.max(0, attempt - 1))
}

export function nextRetryAt(attempt: number, from = new Date()) {
  return new Date(from.getTime() + retryDelayMinutes(attempt) * 60_000).toISOString()
}
