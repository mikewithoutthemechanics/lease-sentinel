import type { SupabaseClient } from '@supabase/supabase-js'
import { encryptSecret, maskSecret, readSecret } from '@/lib/integrations/crypto'
import type { PayfastCredentials, PayfastMode } from '@/lib/payments/payfast'

export interface IntegrationConnection {
  id: string
  owner_id: string
  provider: string
  status: 'connected' | 'disconnected' | 'error' | 'syncing'
  mode: PayfastMode
  settings: Record<string, unknown>
  credentials: Record<string, unknown>
  health_status: 'unknown' | 'healthy' | 'degraded' | 'failing'
  last_health_check_at: string | null
  last_synced_at: string | null
  last_error: string | null
  connected_at: string | null
}

type Client = SupabaseClient

export async function getConnection(supabase: Client, ownerId: string, provider: string) {
  const { data } = await supabase.from('integration_connections').select('*').eq('owner_id', ownerId).eq('provider', provider).maybeSingle()
  return (data as IntegrationConnection | null) ?? null
}

/** Finds the Payfast connection that owns an incoming ITN by merchant id. */
export async function findConnectionByMerchantId(supabase: Client, merchantId: string) {
  const { data } = await supabase.from('integration_connections').select('*').eq('provider', 'payfast').eq('settings->>merchant_id', merchantId).limit(1)
  return ((data ?? [])[0] as IntegrationConnection | undefined) ?? null
}

export function payfastCredentialsFrom(connection: IntegrationConnection | null): PayfastCredentials | null {
  if (!connection) return envPayfastCredentials()
  const merchantId = String(connection.settings?.merchant_id ?? '')
  const merchantKey = readSecret(connection.credentials?.merchant_key) ?? ''
  const passphrase = readSecret(connection.credentials?.passphrase)
  if (!merchantId || !merchantKey) return envPayfastCredentials()
  return { merchantId, merchantKey, passphrase, mode: connection.mode ?? 'sandbox' }
}

/** Fallback for single-tenant deployments that still configure Payfast via env. */
export function envPayfastCredentials(): PayfastCredentials | null {
  const merchantId = process.env.PAYFAST_MERCHANT_ID
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY
  if (!merchantId || !merchantKey) return null
  return { merchantId, merchantKey, passphrase: process.env.PAYFAST_PASSPHRASE, mode: (process.env.PAYFAST_MODE as PayfastMode) || 'sandbox' }
}

export interface SavePayfastInput {
  ownerId: string
  merchantId: string
  merchantKey?: string
  passphrase?: string
  mode: PayfastMode
}

/** Upserts Payfast settings, encrypting the merchant key and passphrase at rest. */
export async function savePayfastConnection(supabase: Client, input: SavePayfastInput) {
  const existing = await getConnection(supabase, input.ownerId, 'payfast')
  const credentials: Record<string, unknown> = { ...(existing?.credentials ?? {}) }
  if (input.merchantKey) credentials.merchant_key = encryptSecret(input.merchantKey)
  if (input.passphrase !== undefined) credentials.passphrase = input.passphrase ? encryptSecret(input.passphrase) : null
  const settings = { ...(existing?.settings ?? {}), merchant_id: input.merchantId }
  const { data, error } = await supabase
    .from('integration_connections')
    .upsert({
      owner_id: input.ownerId,
      provider: 'payfast',
      mode: input.mode,
      settings,
      credentials,
      status: credentials.merchant_key ? 'connected' : 'disconnected',
      connected_at: existing?.connected_at ?? new Date().toISOString(),
      last_error: null,
    }, { onConflict: 'owner_id,provider' })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as IntegrationConnection
}

/** Browser-safe projection: never leaks decrypted secrets. */
export function publicConnectionView(connection: IntegrationConnection | null) {
  if (!connection) return null
  const merchantKey = readSecret(connection.credentials?.merchant_key)
  const passphrase = readSecret(connection.credentials?.passphrase)
  return {
    id: connection.id,
    provider: connection.provider,
    status: connection.status,
    mode: connection.mode ?? 'sandbox',
    merchantId: String(connection.settings?.merchant_id ?? ''),
    merchantKeyMask: maskSecret(merchantKey),
    passphraseSet: Boolean(passphrase),
    healthStatus: connection.health_status ?? 'unknown',
    lastHealthCheckAt: connection.last_health_check_at,
    lastSyncedAt: connection.last_synced_at,
    lastError: connection.last_error,
    connectedAt: connection.connected_at,
  }
}

export async function recordAudit(supabase: Client, entry: { actorId?: string | null; action: string; entityType: string; entityId?: string | null; source?: 'user' | 'ai' | 'cron' | 'integration'; metadata?: Record<string, unknown> }) {
  await supabase.from('audit_events').insert({
    actor_id: entry.actorId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    source: entry.source ?? 'integration',
    metadata: entry.metadata ?? {},
  })
}

export async function startSyncRun(supabase: Client, ownerId: string, provider: string, kind: string) {
  const { data } = await supabase.from('integration_sync_runs').insert({ owner_id: ownerId, provider, kind, status: 'running' }).select('id').single()
  return (data?.id as string | undefined) ?? null
}

export async function finishSyncRun(supabase: Client, runId: string | null, status: 'succeeded' | 'partial' | 'failed', stats: Record<string, unknown>, error?: string) {
  if (!runId) return
  await supabase.from('integration_sync_runs').update({ status, stats, error: error ?? null, finished_at: new Date().toISOString() }).eq('id', runId)
}
