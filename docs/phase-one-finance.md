# Phase 1: Financial control

## Apply migrations

Run the migrations in order in Supabase SQL Editor or with the Supabase CLI:

```bash
supabase db push
```

Files:

- `supabase/migrations/001_financial_control.sql`
- `supabase/migrations/002_finance_operations.sql`

## Required environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # server-only; never expose to the browser
PAYFAST_PASSPHRASE=...
CRON_SECRET=...
```

## Scheduled recurring invoices

Configure the deployment scheduler to call the protected endpoint daily:

```http
POST /api/cron/recurring-invoices
Authorization: Bearer $CRON_SECRET
```

The database function creates due invoices once and advances each recurring charge according to its monthly, quarterly or annual frequency.

## Finance API

- `GET /api/finance` loads current-month invoices, payments, expenses, arrears and summary totals.
- `POST /api/finance` with `action: expense` records an expense.
- `POST /api/finance` with `action: import-bank-csv` imports normalised CSV rows idempotently.
- `POST /api/finance` with `action: create-statement` generates a draft owner statement.
- `POST /api/finance` with `action: approve-distribution` approves a pending owner distribution.
- `POST /api/finance` with `action: run-recurring` runs due schedules for an authenticated manager.

CSV columns supported: `date,description,reference,amount,balance`. Amounts should be signed: positive income and negative expenses.

Payfast ITN notifications are signature checked, amount checked against the invoice, processed using the service role after verification, and protected against duplicate `pf_payment_id` inserts.
