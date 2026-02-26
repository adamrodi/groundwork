import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Jobs from './Jobs'
import type { Job } from '@/lib/types'

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
      <Jobs />
    </MemoryRouter>
  )
}

function makeChain(result: { data: unknown; error: unknown }) {
  const terminal = { then: (r: (v: unknown) => void) => r(result) }
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'eq', 'order', 'single', 'maybeSingle']
  for (const m of methods) {
    chain[m] = vi.fn(() => ({ ...chain, ...terminal }))
  }
  return { ...chain, ...terminal }
}

type JobWithClient = Job & { clients: { name: string } }

const sampleJobs: JobWithClient[] = [
  {
    id: 'j1',
    user_id: 'user-1',
    client_id: 'c1',
    description: 'Lawn mowing front and back yard',
    date: '2024-06-15',
    status: 'pending',
    created_at: '2024-06-15T00:00:00Z',
    clients: { name: 'Alice Smith' },
  },
  {
    id: 'j2',
    user_id: 'user-1',
    client_id: 'c2',
    description: null,
    date: '2024-06-10',
    status: 'complete',
    created_at: '2024-06-10T00:00:00Z',
    clients: { name: 'Bob Jones' },
  },
]

beforeEach(() => {
  mockFrom.mockReset()
})

describe('Jobs page', () => {
  it('shows empty state when no jobs returned', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    renderPage()
    expect(await screen.findByText(/no jobs yet/i)).toBeInTheDocument()
  })

  it('renders "New Job" link to /jobs/new', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [], error: null }))
    renderPage()
    await screen.findByText(/no jobs yet/i)
    expect(screen.getByRole('link', { name: /new job/i })).toHaveAttribute('href', '/jobs/new')
  })

  it('renders job rows with client name, description, date, and status badge', async () => {
    mockFrom.mockReturnValue(makeChain({ data: sampleJobs, error: null }))
    renderPage()
    expect(await screen.findByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Lawn mowing front and back yard')).toBeInTheDocument()
    expect(screen.getByText('2024-06-15')).toBeInTheDocument()
    expect(screen.getByText('pending')).toBeInTheDocument()
  })

  it('truncates description longer than 40 characters', async () => {
    const longDesc = 'A'.repeat(50)
    const jobs: JobWithClient[] = [
      { ...sampleJobs[0], id: 'j3', description: longDesc },
    ]
    mockFrom.mockReturnValue(makeChain({ data: jobs, error: null }))
    renderPage()
    await screen.findByText(longDesc.slice(0, 40) + '…')
  })

  it('shows "—" for null description', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [sampleJobs[1]], error: null }))
    renderPage()
    await screen.findByText('Bob Jones')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('renders complete status badge', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [sampleJobs[1]], error: null }))
    renderPage()
    expect(await screen.findByText('complete')).toBeInTheDocument()
  })

  it('description cell links to /jobs/:id', async () => {
    mockFrom.mockReturnValue(makeChain({ data: [sampleJobs[0]], error: null }))
    renderPage()
    expect(
      await screen.findByRole('link', { name: 'Lawn mowing front and back yard' })
    ).toHaveAttribute('href', '/jobs/j1')
  })
})
