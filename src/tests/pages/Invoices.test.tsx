import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Invoices from '@/pages/Invoices'
import type { Invoice } from '@/lib/types'
import { makeChain } from '@/tests/helpers'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  render(
    <MemoryRouter>
      <Invoices />
    </MemoryRouter>
  )
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

type InvoiceWithClient = Invoice & { clients: { name: string } }

const sampleInvoices: InvoiceWithClient[] = [
  {
    id: 'inv-1', user_id: 'user-1', job_id: 'j1', client_id: 'c1',
    invoice_number: 1, status: 'draft', total: 5000,
    sent_at: null, paid_at: null, created_at: '2025-01-10T00:00:00Z',
    clients: { name: 'Alice Smith' },
  },
  {
    id: 'inv-2', user_id: 'user-1', job_id: 'j2', client_id: 'c2',
    invoice_number: 2, status: 'sent', total: 10000,
    sent_at: '2025-01-12T00:00:00Z', paid_at: null, created_at: '2025-01-11T00:00:00Z',
    clients: { name: 'Bob Jones' },
  },
  {
    id: 'inv-3', user_id: 'user-1', job_id: 'j3', client_id: 'c3',
    invoice_number: 3, status: 'paid', total: 20000,
    sent_at: '2025-01-13T00:00:00Z', paid_at: '2025-01-14T00:00:00Z', created_at: '2025-01-12T00:00:00Z',
    clients: { name: 'Carol White' },
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFrom.mockReset()
})

describe('Invoices', () => {
  it('shows empty state when there are no invoices', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    renderPage()

    expect(await screen.findByText(/no invoices yet/i)).toBeInTheDocument()
  })

  it('renders invoice rows with number, client, and total', async () => {
    mockFrom.mockReturnValue(makeChain({ data: sampleInvoices, error: null }))
    renderPage()

    expect(await screen.findByText('#1')).toBeInTheDocument()
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
    expect(screen.getByText('Carol White')).toBeInTheDocument()
  })

  it('renders all three status badges (draft, sent, paid)', async () => {
    mockFrom.mockReturnValue(makeChain({ data: sampleInvoices, error: null }))
    renderPage()

    await screen.findByText('#1')
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('sent')).toBeInTheDocument()
    expect(screen.getByText('paid')).toBeInTheDocument()
  })
})
