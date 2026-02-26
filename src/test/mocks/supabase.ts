import { vi } from 'vitest'

// Builds a chainable Supabase query mock that resolves to `result`.
// Supports: .from().select().eq().order().single().maybeSingle()
export function makeQueryMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle']
  for (const m of methods) {
    chain[m] = vi.fn(() => chain)
  }
  // Terminal awaitable — resolves when awaited
  const thenable = {
    ...chain,
    then: (resolve: (v: unknown) => void) => resolve(result),
  }
  for (const m of methods) {
    ;(thenable as Record<string, unknown>)[m] = vi.fn(() => thenable)
  }
  return thenable
}

// Creates a vi.fn() for supabase.from() that returns a query mock for the given result.
export function makeFromMock(result: { data: unknown; error: unknown }) {
  return vi.fn(() => makeQueryMock(result))
}
