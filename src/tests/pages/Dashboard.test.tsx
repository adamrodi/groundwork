import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '@/pages/Dashboard'
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
      <Dashboard />
    </MemoryRouter>
  )
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const outstandingInvoices = [
  {
    id: 'inv-1', user_id: 'user-1', job_id: 'j1', client_id: 'c1',
    invoice_number: 10, status: 'sent', total: 15000,
    sent_at: '2026-02-20T00:00:00Z', paid_at: null, created_at: '2026-02-19T00:00:00Z',
    clients: { name: 'Alice Smith' },
  },
]

const paidInvoices = [{ total: 25000 }, { total: 10000 }]

const recentJobs = [
  {
    id: 'j-1', user_id: 'user-1', client_id: 'c2',
    description: 'Front yard landscaping', date: '2026-03-01', status: 'complete',
    created_at: '2026-03-01T00:00:00Z', clients: { name: 'Bob Jones' },
  },
]

function setupMocks(
  outstanding = outstandingInvoices,
  paid = paidInvoices,
  jobs = recentJobs,
) {
  mockFrom
    .mockReturnValueOnce(makeChain({ data: outstanding, error: null }))
    .mockReturnValueOnce(makeChain({ data: paid, error: null }))
    .mockReturnValueOnce(makeChain({ data: jobs, error: null }))
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFrom.mockReset()
})

describe('Dashboard', () => {
  it('renders summary cards with outstanding and paid totals', async () => {
    setupMocks()
    renderPage()

    expect(await screen.findByText('Outstanding')).toBeInTheDocument()
    expect(screen.getByText('Paid this month')).toBeInTheDocument()
    // outstanding: 15000 cents = $150.00 (appears in card + invoice row)
    // paid: 25000+10000 = 35000 cents = $350.00
    expect(screen.getAllByText(/150\.00/).length).toBeGreaterThan(0)
    expect(screen.getByText(/350\.00/)).toBeInTheDocument()
    expect(screen.getByText(/1 invoice/)).toBeInTheDocument()
  })

  it('shows "All paid up" when no outstanding invoices', async () => {
    setupMocks([], paidInvoices, recentJobs)
    renderPage()

    expect(await screen.findByText(/all paid up/i)).toBeInTheDocument()
  })

  it('renders outstanding invoice rows', async () => {
    setupMocks()
    renderPage()

    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText(/Sent \d+ days? ago/)).toBeInTheDocument()
    expect(screen.getAllByText(/150\.00/).length).toBeGreaterThan(0)
  })

  it('renders recent jobs with client name and description', async () => {
    setupMocks()
    renderPage()

    expect(await screen.findByText('Bob Jones')).toBeInTheDocument()
    expect(screen.getByText('Front yard landscaping')).toBeInTheDocument()
    expect(screen.getByText('complete')).toBeInTheDocument()
  })

  it('shows "No jobs yet" when there are no recent jobs', async () => {
    setupMocks(outstandingInvoices, paidInvoices, [])
    renderPage()

    expect(await screen.findByText(/no jobs yet/i)).toBeInTheDocument()
  })

  it('shows error message on fetch failure', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'fail' } }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()

    expect(await screen.findByText(/failed to load dashboard data/i)).toBeInTheDocument()
  })
})
