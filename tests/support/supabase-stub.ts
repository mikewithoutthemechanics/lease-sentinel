/**
 * Minimal in-memory stand-in for the Supabase client, supporting the subset of
 * the query builder the Payfast ledger uses: select/eq/maybeSingle/single,
 * insert, update and upsert with an onConflict key.
 */
export type Row = Record<string, unknown>

type Filter = { column: string; value: unknown }

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`
}

export class SupabaseStub {
  tables: Record<string, Row[]>

  constructor(tables: Record<string, Row[]> = {}) {
    this.tables = tables
  }

  rows(table: string) {
    if (!this.tables[table]) this.tables[table] = []
    return this.tables[table]
  }

  from(table: string) {
    const getRows = (name: string) => this.rows(name)
    const setRows = (name: string, rows: Row[]) => { this.tables[name] = rows }
    const filters: Filter[] = []
    let pending: { type: 'insert' | 'update' | 'upsert'; values: Row; onConflict?: string } | null = null

    const matches = (row: Row) => filters.every((filter) => row[filter.column] === filter.value)

    function apply(): Row[] {
      if (!pending) return getRows(table).filter(matches)
      if (pending.type === 'insert') {
        const row = { id: randomId(table), ...pending.values }
        getRows(table).push(row)
        return [row]
      }
      if (pending.type === 'update') {
        const updated = getRows(table).filter(matches)
        for (const row of updated) Object.assign(row, pending.values)
        return updated
      }
      const keys = (pending.onConflict ?? 'id').split(',').map((key) => key.trim())
      const existing = getRows(table).find((row) => keys.every((key) => row[key] === pending!.values[key]))
      if (existing) { Object.assign(existing, pending.values); return [existing] }
      const row = { id: randomId(table), ...pending.values }
      getRows(table).push(row)
      return [row]
    }

    const builder = {
      select() { return builder },
      order() { return builder },
      limit() { return builder },
      gte() { return builder },
      lte() { return builder },
      eq(column: string, value: unknown) { filters.push({ column, value }); return builder },
      insert(values: Row) { pending = { type: 'insert', values }; return builder },
      update(values: Row) { pending = { type: 'update', values }; return builder },
      upsert(values: Row, options?: { onConflict?: string }) { pending = { type: 'upsert', values, onConflict: options?.onConflict }; return builder },
      delete() { setRows(table, getRows(table).filter((row) => !matches(row))); return builder },
      maybeSingle() { const result = apply(); return Promise.resolve({ data: result[0] ?? null, error: null }) },
      single() { const result = apply(); return Promise.resolve({ data: result[0] ?? null, error: result[0] ? null : { message: 'No rows' } }) },
      then(onFulfilled: (value: { data: Row[]; error: null }) => unknown) { return Promise.resolve({ data: apply(), error: null }).then(onFulfilled) },
    }
    return builder
  }
}
