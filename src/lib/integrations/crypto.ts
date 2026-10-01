import crypto from 'crypto'

// Integration secrets (Payfast passphrase/merchant key today, OAuth refresh
// tokens later) are encrypted at rest with AES-256-GCM before they touch the
// database. INTEGRATION_ENCRYPTION_KEY must be 32 bytes, hex or base64 encoded.

export interface EncryptedSecret { v: 1; iv: string; tag: string; data: string }

export function isEncryptedSecret(value: unknown): value is EncryptedSecret {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return candidate.v === 1 && typeof candidate.iv === 'string' && typeof candidate.tag === 'string' && typeof candidate.data === 'string'
}

export function getEncryptionKey(rawKey = process.env.INTEGRATION_ENCRYPTION_KEY) {
  if (!rawKey) throw new Error('INTEGRATION_ENCRYPTION_KEY is not configured')
  const key = /^[0-9a-fA-F]{64}$/.test(rawKey) ? Buffer.from(rawKey, 'hex') : Buffer.from(rawKey, 'base64')
  if (key.length !== 32) throw new Error('INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes')
  return key
}

export function encryptSecret(plainText: string, rawKey?: string): EncryptedSecret {
  const key = getEncryptionKey(rawKey)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const data = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  return { v: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: data.toString('base64') }
}

export function decryptSecret(secret: EncryptedSecret, rawKey?: string) {
  const key = getEncryptionKey(rawKey)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(secret.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(secret.tag, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(secret.data, 'base64')), decipher.final()]).toString('utf8')
}

/** Decrypts when the value is an encrypted envelope, otherwise returns undefined. */
export function readSecret(value: unknown, rawKey?: string) {
  if (!isEncryptedSecret(value)) return undefined
  try { return decryptSecret(value, rawKey) } catch { return undefined }
}

/** Shows only the last characters of a secret so the UI can confirm what is stored. */
export function maskSecret(value?: string, visible = 4) {
  if (!value) return ''
  if (value.length <= visible) return '•'.repeat(value.length)
  return `${'•'.repeat(Math.min(8, value.length - visible))}${value.slice(-visible)}`
}

/** Constant-time string comparison that never throws on length mismatch. */
export function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return difference === 0
}
