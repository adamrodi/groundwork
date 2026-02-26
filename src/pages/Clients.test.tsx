import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Clients from './Clients'
import type { Client } from '@/lib/types'

// Hoist mockFrom so it's available inside vi.mock factory
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

function renderPage() {
  render(
    <MemoryRouter>
      <Clients />
    </MemoryRouter>
  )
}

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {}
  const terminal = { then: (r: (v: unknown) => void) => r(result) }
  const methods = ['select', 'insert', 'order', 'eq', 'single']
  for (const m of methods) {
    chain[m] = vi.fn(() => ({ ...chain, ...terminal }))
  }
  return { ...chain, ...terminal }
}

const sampleClients: Client[] = [
  {
    id: 'c1',
    user_id: 'user-1',
    name: 'Alice Smith',
    phone: '555-1111',
    email: 'alice@example.com',
    address: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'c2',
    user_id: 'user-1',
    name: 'Bob Jones',
    phone: null,
    email: 'bob@example.com',
    address: null,
    created_at: '2024-01-02T00:00:00Z',
  },
]

beforeEach(() => {
  mockFrom.mockReset()
})

describe('Clients page', () => {
  it('shows empty state when no clients', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByText(/no clients yet/i)).toBeInTheDocument()
  })

  it('renders client list with name links, phone, email', async () => {
    mockFrom.mockReturnValue(makeChain({ data: sampleClients, error: null }))
    renderPage()
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('555-1111')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    // Alice's name should be a link to /clients/c1
    expect(screen.getByRole('link', { name: 'Alice Smith' })).toHaveAttribute('href', '/clients/c1')
  })

  it('opens dialog when "New Client" button is clicked', async () => {
    const user = userEvent.setup()
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    renderPage()
    await screen.findByText(/no clients yet/i)
    await user.click(screen.getByRole('button', { name: /new client/i }))
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
  })

  it('inserts client and refreshes list on dialog submit', async () => {
    const user = userEvent.setup()
    const newClient: Client = {
      id: 'c3',
      user_id: 'user-1',
      name: 'Carol White',
      phone: null,
      email: null,
      address: null,
      created_at: '2024-01-03T00:00:00Z',
    }

    // First call: initial fetch (empty), second call: insert, third call: refresh
    mockFrom
      .mockReturnValueOnce(makeChain({ data: [], error: null }))         // initial fetch
      .mockReturnValueOnce(makeChain({ data: null, error: null }))        // insert
      .mockReturnValueOnce(makeChain({ data: [newClient], error: null })) // refresh

    renderPage()
    await screen.findByText(/no clients yet/i)

    await user.click(screen.getByRole('button', { name: /new client/i }))
    await user.type(screen.getByLabelText(/name/i), 'Carol White')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByText('Carol White')).toBeInTheDocument()
  })
})
