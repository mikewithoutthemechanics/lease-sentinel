# Phase 4 · Slice 1: Payfast sandbox authentication and two-way reconciliation

This slice makes Payfast a real, auditable money rail: per-landlord merchant
credentials (encrypted), sandbox/live switching, verified ITN webhooks with
idempotency and retries, refunds, and a two-way reconciliation between the
Lease Sentinel ledger and Payfast's own transaction history.

## Apply the migration

```bash
supabase db push   # adds supabase/migrations/007_payfast_reconciliation.sql
```

What it adds:

| Object | Purpose |
| --- | --- |
| `integration_connections.mode / credentials / health_status` | Sandbox vs live, AES-256-GCM encrypted secrets, health state |
| `payments.fee_amount / net_amount / status / refunded_amount` | Provider fee split and refund state |
| `payfast_transactions` | One row per `pf_payment_id` with its reconciliation state |
| `integration_webhook_events` | Webhook log, idempotency key, attempts, retry schedule |
| `integration_sync_runs` | Health checks and reconciliation history |

`credentials` is revoked from `anon`/`authenticated`; only the service role
reads it, and the API never returns decrypted secrets to the browser.

## Environment variables

```env
INTEGRATION_ENCRYPTION_KEY=...   # 32 bytes, hex or base64: openssl rand -base64 32
NEXT_PUBLIC_SITE_URL=https://app.yourdomain.co.za
CRON_SECRET=...

# Optional single-tenant fallback if credentials are not stored per landlord
PAYFAST_MERCHANT_ID=10000100
PAYFAST_MERCHANT_KEY=46f0cd694581a
PAYFAST_PASSPHRASE=...
PAYFAST_MODE=sandbox

# Local testing only - skips reverse-DNS and the Payfast server validation call
PAYFAST_SKIP_SOURCE_CHECK=true
PAYFAST_SKIP_SERVER_VALIDATE=true
```

## Sandbox setup

1. Sign in at <https://sandbox.payfast.co.za> (merchant ID `10000100`, key
   `46f0cd694581a`) and set a passphrase in **Settings → Integration**.
2. In Lease Sentinel open **Dashboard → Integrations → Payfast**, enter the
   merchant ID, key and passphrase, keep the environment on **Sandbox** and
   save. Secrets are encrypted before they are written.
3. Click **Test connection** — it signs a `GET /ping` request with the Payfast
   API signature scheme and records the result as a health check.
4. Set the sandbox ITN URL to `https://<your-domain>/api/payfast/notify`.
   Whitelist your server IP in the Payfast integration settings for API calls.

## Payment flow

- `POST /api/payfast/checkout` with `{ invoiceId }` returns `{ action, fields }`.
  The caller (tenant, landlord or manager on that lease) posts `fields` to
  `action` — sandbox or live, depending on the landlord's connection.
- Payfast calls `POST /api/payfast/notify`. The handler:
  1. stores the raw payload keyed by a SHA-256 idempotency key
     (`merchant_id:pf_payment_id:status:amount`) so replays are no-ops;
  2. resolves the landlord from `merchant_id`, verifies the MD5 signature in
     constant time against that merchant's passphrase;
  3. confirms the source (reverse DNS on `*.payfast.co.za`) and posts the
     payload back to `/eng/query/validate`;
  4. applies the ITN: upserts `payfast_transactions`, inserts the payment with
     its fee/net split, allocates it to the invoice and recomputes the invoice
     status; `COMPLETE` pays, `REFUNDED` reopens, `PENDING`/`FAILED`/`CANCELLED`
     are ledgered without moving money;
  5. flags an `amount_mismatch` instead of banking a wrong amount;
  6. writes an `audit_events` row for every outcome.

Signature or source failures are stored as `rejected` and answered with `400`.
Processing failures are stored as `failed` with an exponential-backoff
`next_retry_at` and answered with `500` so Payfast retries too.

## Retries

- `POST /api/cron/webhook-retries` (Bearer `CRON_SECRET`, scheduled every 10
  minutes in `vercel.json`) replays failed events up to 6 attempts with
  1, 2, 4, 8, 16, 32-minute backoff.
- The Payfast dashboard page also has a manual **Retry** action per event.

## Two-way reconciliation

`POST /api/integrations/payfast` with `{ action: 'reconcile', from, to }`:

1. pulls `GET /transactions/history?from=&to=` from the Payfast API
   (`?testing=true` in sandbox);
2. compares it with `payfast_transactions` for the period in both directions;
3. writes back `matched`, `amount_mismatch`, `missing_locally` (ingesting the
   Payfast-side transaction so nothing is lost) and `missing_at_payfast`;
4. records an `integration_sync_runs` row with counts and an audit event.

Other actions on the same endpoint: `save-settings`, `health-check`,
`retry-webhook`, `refund` (calls `POST /refunds/{pf_payment_id}` then updates
the payment, transaction and invoice), and `disconnect` with an optional
`purge` that deletes the stored Payfast transactions and webhook logs.

## Verification checklist

- `npm test` — 27 unit tests covering signatures, idempotency keys, the status
  state machine, reconciliation in both directions, retry backoff, secret
  encryption and the ledger side effects.
- Run a sandbox payment and confirm the invoice flips to `paid`, the payment
  shows the Payfast fee, and the webhook log shows `processed`.
- Replay the same ITN (curl the stored payload) and confirm `Already processed`
  with no second payment row.
- Tamper with one field and confirm `400 Invalid signature` plus a `rejected`
  webhook row and a `payfast_webhook_rejected` audit event.
- Send an ITN with the wrong `amount_gross` and confirm the transaction is
  flagged `amount_mismatch` and no payment is recorded.
- Refund a sandbox transaction and confirm the invoice reopens.
- Disconnect with purge and confirm credentials, transactions and webhook logs
  are gone while the audit trail of the disconnect remains.
