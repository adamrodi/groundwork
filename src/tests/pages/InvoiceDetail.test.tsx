import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InvoiceDetail from '@/pages/InvoiceDetail'
import { makeChain } from '@/tests/helpers'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockFrom, mockInvoke } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockInvoke: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    functions: { invoke: mockInvoke },
  },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/components/InvoicePDF', () => ({
  downloadInvoicePDF: vi.fn(),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage(invoiceId = 'inv-001') {
  render(
    <MemoryRouter initialEntries={[`/invoices/${invoiceId}`]}>
      <Routes>
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
      </Routes>
    </MemoryRouter>
  )
}


// ── Fixtures ─────────────────────────────────────────────────────────────────

const draftInvoice = {
  id: 'inv-001',
  user_id: 'user-1',
  job_id: 'job-001',
  client_id: 'client-001',
  invoice_number: 42,
  status: 'draft',
  total: 12000,
  sent_at: null,
  paid_at: null,
  created_at: '2025-01-15T10:00:00Z',
  jobs: { description: 'Lawn mowing', date: '2025-01-10' },
}

const sentInvoice = { ...draftInvoice, status: 'sent', sent_at: '2025-01-16T00:00:00Z' }

const paidInvoice = { ...draftInvoice, status: 'paid', sent_at: '2025-01-16T00:00:00Z', paid_at: '2025-01-20T00:00:00Z' }

const mockClient = {
  id: 'client-001',
  user_id: 'user-1',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-0100',
  address: '123 Main St',
  created_at: '2025-01-01T00:00:00Z',
}

const mockLineItems = [
  { id: 'li-1', job_id: 'job-001', description: 'Lawn mowing', quantity: 1, unit_price: 12000 },
]

function setupFetchMocks(invoice = draftInvoice) {
  mockFrom
    .mockReturnValueOnce(makeChain({ data: invoice, error: null }))
    .mockReturnValueOnce(makeChain({ data: mockClient, error: null }))
    .mockReturnValueOnce(makeChain({ data: mockLineItems, error: null }))
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockFrom.mockReset()
  mockInvoke.mockReset()
})

describe('InvoiceDetail', () => {
  it('renders invoice details after loading', async () => {
    setupFetchMocks()
    renderPage()

    expect(await screen.findByText('Invoice #42')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getAllByText('Lawn mowing').length).toBeGreaterThan(0)
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('shows "Invoice not found" when fetch fails', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
    renderPage()

    expect(await screen.findByText(/invoice not found/i)).toBeInTheDocument()
  })

  it('shows Send via SMS and Send via Email on draft invoices', async () => {
    setupFetchMocks(draftInvoice)
    renderPage()

    await screen.findByText('Invoice #42')
    expect(screen.getByRole('button', { name: /send via sms/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send via email/i })).toBeInTheDocument()
  })

  it('shows Mark as Paid on sent invoices but not Send buttons', async () => {
    setupFetchMocks(sentInvoice)
    renderPage()

    await screen.findByText('Invoice #42')
    expect(screen.getByRole('button', { name: /mark as paid/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send via sms/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send via email/i })).not.toBeInTheDocument()
  })

  it('updates status to paid after clicking Mark as Paid', async () => {
    const user = userEvent.setup()
    setupFetchMocks(sentInvoice)
    // Mock the update chain: .from('invoices').update(...).eq(...).select().single()
    mockFrom.mockReturnValueOnce(
      makeChain({ data: { ...sentInvoice, status: 'paid', paid_at: '2025-01-20T00:00:00Z' }, error: null })
    )
    renderPage()

    await screen.findByText('Invoice #42')
    await user.click(screen.getByRole('button', { name: /mark as paid/i }))

    expect(await screen.findByText('paid')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mark as paid/i })).not.toBeInTheDocument()
  })

  it('calls send-invoice edge function when clicking Send via Email', async () => {
    const user = userEvent.setup()
    setupFetchMocks(draftInvoice)
    mockInvoke.mockResolvedValue({ data: null, error: null })
    renderPage()

    await screen.findByText('Invoice #42')
    await user.click(screen.getByRole('button', { name: /send via email/i }))

    expect(mockInvoke).toHaveBeenCalledWith('send-invoice', { body: { invoiceId: 'inv-001' } })
    await waitFor(() => {
      expect(screen.getByText('sent')).toBeInTheDocument()
    })
  })
})
