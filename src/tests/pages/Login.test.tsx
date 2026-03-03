import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from '@/pages/Login'

// ── Mocks ────────────────────────────────────────────────────────────────────

const { mockUseAuth, mockSignIn, mockSignUp, mockNavigate } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
    },
  },
}))

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockUseAuth.mockReturnValue({ session: null, loading: false })
  mockSignIn.mockReset()
  mockSignUp.mockReset()
  mockNavigate.mockReset()
})

describe('Login', () => {
  it('redirects to / when already authenticated', () => {
    mockUseAuth.mockReturnValue({ session: { user: { id: 'u1' } }, loading: false })
    renderPage()

    // Navigate to="/" renders the home route
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('renders sign-in form by default', () => {
    renderPage()

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls signInWithPassword and navigates on successful sign-in', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows error on sign-in failure', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } })
    renderPage()

    await user.type(screen.getByLabelText(/email/i), 'bad@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument()
  })

  it('switches to sign-up mode', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /create one/i }))

    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('shows confirmation message after successful sign-up', async () => {
    const user = userEvent.setup()
    mockSignUp.mockResolvedValue({ error: null })
    renderPage()

    await user.click(screen.getByRole('button', { name: /create one/i }))
    await user.type(screen.getByLabelText(/email/i), 'new@example.com')
    await user.type(screen.getByLabelText(/password/i), 'newpass123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })
})
