import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCents } from '@/lib/utils'

export type LineItemDraft = {
  description: string
  quantity: string
  unit_price: string
}

type LineItemsEditorProps = {
  items: LineItemDraft[]
  onChange: (items: LineItemDraft[]) => void
}

export default function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  function updateItem(index: number, field: keyof LineItemDraft, value: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  function addItem() {
    onChange([...items, { description: '', quantity: '', unit_price: '' }])
  }

  const total = items.reduce(
    (sum, item) =>
      sum + Math.round((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) * 100 || 0)),
    0
  )

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            className="flex-1"
            placeholder="Description"
            value={item.description}
            onChange={e => updateItem(i, 'description', e.target.value)}
          />
          <Input
            className="w-20"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Qty"
            value={item.quantity}
            onChange={e => updateItem(i, 'quantity', e.target.value)}
          />
          <div className="flex items-center gap-1">
            <span>$</span>
            <Input
              className="w-28"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={item.unit_price}
              onChange={e => updateItem(i, 'unit_price', e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove item"
            onClick={() => removeItem(i)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addItem}>
        Add line item
      </Button>

      <div className="flex justify-end pt-2 font-medium">
        <span>Total: {formatCents(total)}</span>
      </div>
    </div>
  )
}
