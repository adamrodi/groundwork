import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ClientDetail from './ClientDetail'
import type { Client, Job } from '@/lib/types'

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }))

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

vi.mock('@/lib/auth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

// Render with a route param :id set to clientId
function renderPage(clientId = 'c1') {
  render(
    <MemoryRouter initialEntries={[`/clients/${clientId}`]}>
      <Routes>
        <Route path="/clients/:id" element={<ClientDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

const sampleClient: Client = {
  id: 'c1',
  user_id: 'user-1',
  name: 'Alice Smith',
  phone: '555-1111',
  email: 'alice@example.com',
  address: '123 Main St',
  created_at: '2024-01-01T00:00:00Z',
}

const sampleJob: Job = {
  id: 'j1',
  user_id: 'user-1',
  client_id: 'c1',
  description: 'Lawn mowing front and back',
  date: '2024-06-15',
  status: 'complete',
  created_at: '2024-06-15T00:00:00Z',
}

// Build a chainable mock where .single() and .maybeSingle() resolve to `result`
function makeChain(result: { data: unknown; error: unknown }) {
  const terminal = { then: (r: (v: unknown) => void) => r(result) }
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'single', 'maybeSingle']
  for (const m of methods) {
    chain[m] = vi.fn(() => ({ ...chain, ...terminal }))
  }
  return { ...chain, ...terminal }
}

beforeEach(() => {
  mockFrom.mockReset()
})

describe('ClientDetail page', () => {
  it('shows "Client not found" when Supabase returns an error', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: null, error: { message: 'not found' } }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByText(/client not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back/i })).toBeInTheDocument()
  })

  it('renders client name, phone, email, address', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: sampleClient, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Alice Smith' })).toBeInTheDocument()
    expect(screen.getByText('555-1111')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
  })

  it('shows "No jobs yet" with New Job link when jobs array is empty', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: sampleClient, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()
    await screen.findByRole('heading', { name: 'Alice Smith' })
    expect(screen.getByText(/no jobs yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /new job/i })).toHaveAttribute(
      'href',
      '/jobs/new?client_id=c1'
    )
  })

  it('renders jobs table with description, date, and status badge', async () => {
    mockFrom
      .mockReturnValueOnce(makeChain({ data: sampleClient, error: null }))
      .mockReturnValueOnce(makeChain({ data: [sampleJob], error: null }))
    renderPage()
    await screen.findByRole('heading', { name: 'Alice Smith' })
    expect(screen.getByText('Lawn mowing front and back')).toBeInTheDocument()
    expect(screen.getByText('2024-06-15')).toBeInTheDocument()
    expect(screen.getByText('complete')).toBeInTheDocument()
  })

  it('opens edit dialog pre-filled with client data', async () => {
    const user = userEvent.setup()
    mockFrom
      .mockReturnValueOnce(makeChain({ data: sampleClient, error: null }))
      .mockReturnValueOnce(makeChain({ data: [], error: null }))
    renderPage()
    await screen.findByRole('heading', { name: 'Alice Smith' })
    await user.click(screen.getByRole('button', { name: /edit/i }))
    expect(screen.getByLabelText(/name/i)).toHaveValue('Alice Smith')
    expect(screen.getByLabelText(/phone/i)).toHaveValue('555-1111')
  })

  it('calls update and refreshes client on edit save', async () => {
    const user = userEvent.setup()
    const updatedClient = { ...sampleClient, name: 'Alice Updated' }

    mockFrom
      .mockReturnValueOnce(makeChain({ data: sampleClient, error: null }))   // initial fetch client
      .mockReturnValueOnce(makeChain({ data: [], error: null }))               // initial fetch jobs
      .mockReturnValueOnce(makeChain({ data: null, error: null }))             // update
      .mockReturnValueOnce(makeChain({ data: updatedClient, error: null }))    // refresh client
      .mockReturnValueOnce(makeChain({ data: [], error: null }))               // refresh jobs

    renderPage()
    await screen.findByRole('heading', { name: 'Alice Smith' })

    await user.click(screen.getByRole('button', { name: /edit/i }))
    const nameField = screen.getByLabelText(/name/i)
    await user.clear(nameField)
    await user.type(nameField, 'Alice Updated')
    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(await screen.findByRole('heading', { name: 'Alice Updated' })).toBeInTheDocument()
  })
})
