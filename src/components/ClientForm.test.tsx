import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ClientForm from './ClientForm'
import type { Client } from '@/lib/types'

const onSubmit = vi.fn()
const onCancel = vi.fn()

function renderForm(props: Partial<Parameters<typeof ClientForm>[0]> = {}) {
  render(
    <ClientForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      loading={false}
      {...props}
    />
  )
}

beforeEach(() => {
  onSubmit.mockReset()
  onCancel.mockReset()
})

describe('ClientForm', () => {
  it('renders all 4 fields', () => {
    renderForm()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
  })

  it('does not call onSubmit when name is empty', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('calls onSubmit with correct shape on valid submit', async () => {
    const user = userEvent.setup()
    onSubmit.mockResolvedValue(undefined)
    renderForm()
    await user.type(screen.getByLabelText(/name/i), 'Alice Smith')
    await user.type(screen.getByLabelText(/phone/i), '555-1234')
    await user.type(screen.getByLabelText(/email/i), 'alice@example.com')
    await user.type(screen.getByLabelText(/address/i), '123 Main St')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Alice Smith',
      phone: '555-1234',
      email: 'alice@example.com',
      address: '123 Main St',
    })
  })

  it('disables submit button when loading=true', () => {
    renderForm({ loading: true })
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('pre-fills fields when initialData is provided', () => {
    const initialData: Partial<Client> = {
      name: 'Bob Jones',
      phone: '555-9999',
      email: 'bob@example.com',
      address: '456 Oak Ave',
    }
    renderForm({ initialData })
    expect(screen.getByLabelText(/name/i)).toHaveValue('Bob Jones')
    expect(screen.getByLabelText(/phone/i)).toHaveValue('555-9999')
    expect(screen.getByLabelText(/email/i)).toHaveValue('bob@example.com')
    expect(screen.getByLabelText(/address/i)).toHaveValue('456 Oak Ave')
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('shows an error message when onSubmit throws', async () => {
    const user = userEvent.setup()
    onSubmit.mockRejectedValue(new Error('Network error'))
    renderForm()
    await user.type(screen.getByLabelText(/name/i), 'Alice')
    await user.click(screen.getByRole('button', { name: /save/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
