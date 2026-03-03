import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactElement } from 'react'

/**
 * Creates a mock Supabase query chain that resolves to the given result.
 * Every chainable method (select, eq, order, etc.) returns the chain itself,
 * and the terminal `.then()` resolves with `result`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makeChain(result: { data: unknown; error: unknown }): any {
  const terminal = { then: (r: (v: unknown) => void) => r(result) }
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'single', 'maybeSingle', 'gte', 'limit']
  for (const m of methods) {
    chain[m] = vi.fn(() => ({ ...chain, ...terminal }))
  }
  return { ...chain, ...terminal }
}

/**
 * Renders a component wrapped in MemoryRouter.
 */
export function renderWithRouter(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  )
}
