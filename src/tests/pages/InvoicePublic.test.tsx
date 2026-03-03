import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import InvoicePublic from '@/pages/InvoicePublic'
import { supabase } from '@/lib/supabase'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockConfirmPayment } = vi.hoisted(() => ({
  mockConfirmPayment: vi.fn(),
}))

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue({}),
}))

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => ({ confirmPayment: mockConfirmPayment }),
  useElements: () => ({}),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const INVOICE_ID = 'inv-001'

const mockInvoice = {
  id: INVOICE_ID,
  invoice_number: 42,
  status: 'sent',
  total: 12000,
  user_id: 'user-001',
  client_id: 'client-001',
  job_id: 'job-001',
  created_at: '2025-01-15T10:00:00Z',
  sent_at: '2025-01-15T10:00:00Z',
  paid_at: null,
}

const mockClient = {
  id: 'client-001',
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-0100',
  address: '123 Main St',
}

const mockLineItems = [
  { id: 'li-1', description: 'Lawn mowing', quantity: 1, unit_price: 12000, job_id: 'job-001' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeChain(data: unknown, error: unknown = null): any {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeListChain(data: unknown): any {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

function setupDefaultMocks() {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'invoices') return makeChain(mockInvoice)
    if (table === 'clients') return makeChain(mockClient)
    if (table === 'line_items') return makeListChain(mockLineItems)
    return makeChain(null)
  })
  vi.mocked(supabase.functions.invoke).mockResolvedValue({
    data: { clientSecret: 'pi_test_secret_abc', stripeAccountId: 'acct_123' },
    error: null,
  })
}

function renderPage(path = `/i/${INVOICE_ID}`) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/i/:id" element={<InvoicePublic />} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('InvoicePublic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupDefaultMocks()
    mockConfirmPayment.mockResolvedValue({
      paymentIntent: { status: 'succeeded' },
    })
  })

  it('renders invoice details after loading', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Invoice #42')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Lawn mowing')).toBeInTheDocument()
    })
  })

  it('shows Pay with Card button on a sent invoice', async () => {
    renderPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pay with card/i })).toBeInTheDocument()
    })
  })

  it('shows the payment form after clicking Pay with Card', async () => {
    renderPage()

    await waitFor(() => screen.getByRole('button', { name: /pay with card/i }))
    await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

    await waitFor(() => {
      expect(screen.getByTestId('payment-element')).toBeInTheDocument()
    })
  })

  it('shows an error when create-payment-intent fails', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: new Error('network error'),
    })
    renderPage()

    await waitFor(() => screen.getByRole('button', { name: /pay with card/i }))
    await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not start checkout/i)
    })
  })

  it('shows the paid banner when ?paid=1 is in the URL (3DS redirect return)', async () => {
    renderPage(`/i/${INVOICE_ID}?paid=1`)

    await waitFor(() => {
      expect(screen.getByText(/payment received/i)).toBeInTheDocument()
    })
  })

  it('shows "Invoice not found" for an unknown invoice', async () => {
    vi.mocked(supabase.from).mockImplementation(() =>
      makeChain(null, { message: 'Not found', code: 'PGRST116' })
    )
    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/invoice not found/i)).toBeInTheDocument()
    })
  })

  it('hides payment button when invoice is already paid', async () => {
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'invoices') return makeChain({ ...mockInvoice, status: 'paid', paid_at: '2025-01-20T00:00:00Z' })
      if (table === 'clients') return makeChain(mockClient)
      if (table === 'line_items') return makeListChain(mockLineItems)
      return makeChain(null)
    })
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('Invoice #42')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /pay with card/i })).not.toBeInTheDocument()
  })

  it('shows success banner after successful payment submission', async () => {
    renderPage()

    await waitFor(() => screen.getByRole('button', { name: /pay with card/i }))
    await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))
    await waitFor(() => screen.getByTestId('payment-element'))
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }))

    await waitFor(() => {
      expect(screen.getByText(/payment received/i)).toBeInTheDocument()
    })
  })

  it('shows error message when card payment fails', async () => {
    mockConfirmPayment.mockResolvedValue({
      error: { message: 'Your card was declined.' },
    })
    renderPage()

    await waitFor(() => screen.getByRole('button', { name: /pay with card/i }))
    await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))
    await waitFor(() => screen.getByTestId('payment-element'))
    await userEvent.click(screen.getByRole('button', { name: /pay now/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Your card was declined.')
    })
  })
})
