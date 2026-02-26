import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import LineItemsEditor, { type LineItemDraft } from './LineItemsEditor'

function emptyItem(): LineItemDraft {
  return { description: '', quantity: '', unit_price: '' }
}

function renderEditor(
  items: LineItemDraft[] = [emptyItem()],
  onChange = vi.fn()
) {
  render(<LineItemsEditor items={items} onChange={onChange} />)
  return { onChange }
}

// Stateful wrapper — lets typing tests work with the controlled component
function StatefulEditor({
  initialItems = [emptyItem()],
  onChangeSpy,
}: {
  initialItems?: LineItemDraft[]
  onChangeSpy: (items: LineItemDraft[]) => void
}) {
  const [items, setItems] = useState(initialItems)
  return (
    <LineItemsEditor
      items={items}
      onChange={next => {
        setItems(next)
        onChangeSpy(next)
      }}
    />
  )
}

function renderStateful(initialItems?: LineItemDraft[]) {
  const onChangeSpy = vi.fn()
  render(<StatefulEditor initialItems={initialItems} onChangeSpy={onChangeSpy} />)
  return { onChangeSpy }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('LineItemsEditor', () => {
  it('renders one row when initialized with one item', () => {
    renderEditor([emptyItem()])
    expect(screen.getAllByRole('button', { name: /remove item/i })).toHaveLength(1)
  })

  it('renders description, qty, and unit price inputs in each row', () => {
    renderEditor([{ description: 'Mowing', quantity: '2', unit_price: '75.00' }])
    expect(screen.getByDisplayValue('Mowing')).toBeInTheDocument()
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('75.00')).toBeInTheDocument()
  })

  it('calls onChange with updated description when description input changes', async () => {
    const user = userEvent.setup()
    const { onChangeSpy } = renderStateful()
    const [descInput] = screen.getAllByPlaceholderText(/description/i)
    await user.type(descInput, 'Lawn mow')
    expect(onChangeSpy).toHaveBeenLastCalledWith([
      expect.objectContaining({ description: 'Lawn mow' }),
    ])
  })

  it('calls onChange with updated quantity when qty input changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderEditor([emptyItem()], onChange)
    const qtyInput = screen.getByPlaceholderText(/qty/i)
    await user.type(qtyInput, '3')
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ quantity: '3' }),
    ])
  })

  it('calls onChange with updated unit_price when price input changes', async () => {
    const user = userEvent.setup()
    const { onChangeSpy } = renderStateful()
    const priceInput = screen.getByPlaceholderText(/0\.00/i)
    await user.type(priceInput, '50')
    expect(onChangeSpy).toHaveBeenLastCalledWith([
      expect.objectContaining({ unit_price: '50' }),
    ])
  })

  it('calls onChange with item removed when remove button is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const items: LineItemDraft[] = [
      { description: 'Mowing', quantity: '1', unit_price: '75.00' },
      { description: 'Edging', quantity: '1', unit_price: '25.00' },
    ]
    renderEditor(items, onChange)
    const removeButtons = screen.getAllByRole('button', { name: /remove item/i })
    await user.click(removeButtons[0])
    expect(onChange).toHaveBeenCalledWith([items[1]])
  })

  it('calls onChange with new empty row when "Add line item" is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const items: LineItemDraft[] = [
      { description: 'Mowing', quantity: '1', unit_price: '75.00' },
    ]
    renderEditor(items, onChange)
    await user.click(screen.getByRole('button', { name: /add line item/i }))
    expect(onChange).toHaveBeenCalledWith([
      items[0],
      { description: '', quantity: '', unit_price: '' },
    ])
  })

  it('shows CA$0.00 total when all items are empty', () => {
    renderEditor([emptyItem()])
    expect(screen.getByText(/0\.00/)).toBeInTheDocument()
  })

  it('shows correct total for qty=2, price=75.00', () => {
    renderEditor([{ description: 'Mowing', quantity: '2', unit_price: '75.00' }])
    // 2 * 75.00 = 150.00
    expect(screen.getByText(/150\.00/)).toBeInTheDocument()
  })

  it('shows correct total for multiple items', () => {
    renderEditor([
      { description: 'Mowing', quantity: '1', unit_price: '75.00' },
      { description: 'Edging', quantity: '2', unit_price: '25.00' },
    ])
    // 75 + 50 = 125.00
    expect(screen.getByText(/125\.00/)).toBeInTheDocument()
  })

  it('treats non-numeric qty and price as 0 in total', () => {
    renderEditor([{ description: 'Mowing', quantity: 'abc', unit_price: 'xyz' }])
    expect(screen.getByText(/0\.00/)).toBeInTheDocument()
  })

  it('renders a $ prefix next to the unit price input', () => {
    renderEditor([emptyItem()])
    expect(screen.getByText('$')).toBeInTheDocument()
  })
})
