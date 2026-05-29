import crypto from 'crypto'

export function generatePayfastSignature(data: any, passPhrase?: string) {
  let queryString = Object.keys(data)
    .filter((key) => data[key] !== '' && key !== 'signature')
    .sort()
    .map((key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, '+')}`)
    .join('&')

  if (passPhrase) {
    queryString += `&passphrase=${encodeURIComponent(passPhrase).replace(/%20/g, '+')}`
  }

  return crypto.createHash('md5').update(queryString).digest('hex')
}

export function getPayfastForm(invoice: any, user: any) {
  const data: any = {
    merchant_id: process.env.PAYFAST_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_MERCHANT_KEY,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payments/cancel`,
    notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payfast/notify`,
    name_first: user.full_name?.split(' ')[0] || 'Tenant',
    email_address: user.email,
    m_payment_id: invoice.id,
    amount: invoice.amount.toFixed(2),
    item_name: `Lease Payment: ${invoice.invoice_number}`,
  }

  data.signature = generatePayfastSignature(data)
  return data
}
