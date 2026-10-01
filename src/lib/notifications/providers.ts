type Recipient = { email?: string; phone?: string; full_name?: string }

type NotificationPayload = { subject?: string; body?: string; statementId?: string }

export async function sendNotification(channel: 'email' | 'sms' | 'whatsapp', recipient: Recipient, payload: NotificationPayload) {
  if (channel === 'email') {
    if (!process.env.RESEND_API_KEY || !recipient.email) throw new Error('Email provider or recipient email is not configured')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFICATION_FROM_EMAIL || 'Lease Sentinel <notifications@leasesentinel.co.za>', to: [recipient.email], subject: payload.subject || 'Lease Sentinel notification', text: payload.body || `Hello ${recipient.full_name || 'there'}, you have a new Lease Sentinel notification.` }),
    })
    if (!response.ok) throw new Error(`Resend returned ${response.status}`)
    return
  }
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !recipient.phone) throw new Error('SMS provider or recipient phone is not configured')
  const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const from = channel === 'whatsapp' ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_FROM_NUMBER
  if (!from) throw new Error(channel === 'whatsapp' ? 'TWILIO_WHATSAPP_FROM is not configured' : 'TWILIO_FROM_NUMBER is not configured')
  const form = new URLSearchParams({ To: channel === 'whatsapp' ? `whatsapp:${recipient.phone}` : recipient.phone, From: channel === 'whatsapp' ? `whatsapp:${from}` : from, Body: payload.body || 'You have a new Lease Sentinel notification.' })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form })
  if (!response.ok) throw new Error(`Twilio returned ${response.status}`)
}
