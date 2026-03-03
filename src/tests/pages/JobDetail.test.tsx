import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JobDetail from '@/pages/JobDetail'
import type { Job, LineItem } from '@/lib/types'
import { formatCents } from '@/lib/utils'
import { makeChain } from '@/tests/helpers'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))
const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

function renderPage(jobId = 'j1') {
  render(
    <MemoryRouter initialEntries={[`/jobs/${jobId}`]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

type JobWithClient = Job & { clients: { name: string } }

const pendingJob: JobWithClient = {
  id: 'j1',
  user_id: 'user-1',
  client_id: 'c1',
  description: 'Lawn mowing front yard',
  date: '2024-06-15',
  status: 'pending',
  created_at: '2024-06-15T00:00:00Z',
  clients: { name: 'Alice Smith' },
}

const completeJob: JobWithClient = { ...pendingJob, status: 'complete' }

const sampleLineItems: LineItem[] = [
  { id: 'li1', job_id: 'j1', description: 'Mowing', quantity: 1, unit_price: 7500 },
  { id: 'li2', job_id: 'j1', description: 'Edging', quantity: 2, unit_price: 2500 },
]
// total = 1*7500 + 2*2500 = 12500

beforeEach(() => {
  mockFrom.mockReset()
  mockNavigate.mockReset()
})

describe('JobDetail page', () => {
  it('shows "Job not found" when Supabase returns an error', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByText(/job not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
  })

  it('renders back link to /jobs', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/jobs')
  })

  it('renders client name as a link to /clients/:id', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    const clientLink = await screen.findByRole('link', { name: 'Alice Smith' })
    expect(clientLink).toHaveAttribute('href', '/clients/c1')
  })

  it('renders job date and description', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByText('2024-06-15')).toBeInTheDocument()
    expect(screen.getByText('Lawn mowing front yard')).toBeInTheDocument()
  })

  it('renders status badge', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('renders line items table with description, qty, unit price, and line total', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByText('Mowing')).toBeInTheDocument()
    expect(screen.getByText('Edging')).toBeInTheDocument()
    // Unit price for Mowing: 7500 cents = CA$75.00
    expect(screen.getAllByText(new RegExp(formatCents(7500).replace('$', '\\$'))).length).toBeGreaterThan(0)
    // Line total for Edging: 2 * 2500 = 5000 cents = CA$50.00
    expect(screen.getByText(new RegExp(formatCents(5000).replace('$', '\\$')))).toBeInTheDocument()
  })

  it('renders total row with sum of all line items', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    // Total: 12500 cents = CA$125.00
    expect(screen.getByText(new RegExp(formatCents(12500).replace('$', '\\$')))).toBeInTheDocument()
  })

  it('shows "Mark Complete" button when job is pending', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument()
  })

  it('does not show "Mark Complete" button when job is complete', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: completeJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument()
  })

  it('updates status badge and hides "Mark Complete" after clicking it', async () => {
    const user = userEvent.setup()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })) // update call
    renderPage()
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /mark complete/i }))
    expect(await screen.findByText('complete')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /mark complete/i })).not.toBeInTheDocument()
  })

  it('does not show "Create Invoice" button when job is pending', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: pendingJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.queryByRole('button', { name: /create invoice/i })).not.toBeInTheDocument()
  })

  it('shows "Create Invoice" button when job is complete', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: completeJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
    renderPage()
    await screen.findByText('Alice Smith')
    expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument()
  })

  it('navigates to existing invoice if one already exists for this job', async () => {
    const user = userEvent.setup()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: completeJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: 'inv-existing' }, error: null })) // maybySingle
    renderPage()
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /create invoice/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/inv-existing')
  })

  it('creates a new invoice and navigates when none exists', async () => {
    const user = userEvent.setup()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: completeJob, error: null }))
      .mockReturnValueOnce(makeChain({ data: sampleLineItems, error: null }))
      .mockReturnValueOnce(makeChain({ data: null, error: null })) // maybySingle — no existing invoice
      .mockReturnValueOnce(makeChain({ data: { id: 'inv-new' }, error: null })) // insert invoice
    renderPage()
    await screen.findByText('Alice Smith')
    await user.click(screen.getByRole('button', { name: /create invoice/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/invoices/inv-new')
  })
})
