import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LineItemsEditor, { type LineItemDraft } from '@/components/LineItemsEditor'

type ClientOption = { id: string; name: string }

export default function JobNew() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [clients, setClients] = useState<ClientOption[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)
  const [clientId, setClientId] = useState(searchParams.get('client_id') ?? '')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([
    { description: '', quantity: '', unit_price: '' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')
      setClients((data as ClientOption[]) ?? [])
      setClientsLoading(false)
    }
    fetchClients()
  }, [])

  // Once clients load, clear the pre-selected client_id if it's not a valid client
  useEffect(() => {
    if (clientsLoading) return
    const paramId = searchParams.get('client_id')
    if (!paramId) return
    if (!clients.find(c => c.id === paramId)) {
      setClientId('')
    }
  }, [clients, clientsLoading, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!clientId) {
      setError('Please select a client.')
      return
    }

    const validItems = lineItems.filter(
      item => item.description.trim() && item.unit_price.trim()
    )
    if (validItems.length === 0) {
      setError('Add at least one line item with a description and price.')
      return
    }

    setSaving(true)

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({ user_id: user!.id, client_id: clientId, description: description || null, date, status: 'pending' })
      .select()
      .single()

    if (jobError || !job) {
      setError(jobError?.message ?? 'Failed to create job.')
      setSaving(false)
      return
    }

    const { error: lineItemsError } = await supabase.from('line_items').insert(
      validItems.map(item => ({
        job_id: (job as { id: string }).id,
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: Math.round(parseFloat(item.unit_price) * 100),
      }))
    )

    if (lineItemsError) {
      setError('Job was created but line items failed to save. Please edit the job to add them.')
      setSaving(false)
      navigate(`/jobs/${(job as { id: string }).id}`)
      return
    }

    navigate(`/jobs/${(job as { id: string }).id}`)
  }

  if (clientsLoading) return null

  if (clients.length === 0) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">New Job</h1>
        <p>
          <Link to="/clients" className="underline">
            Add a client first
          </Link>{' '}
          before creating a job.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">New Job</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="client-select">Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="client-select">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="e.g. Lawn mowing, front and back"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Line Items</Label>
          <LineItemsEditor items={lineItems} onChange={setLineItems} />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Create Job'}
        </Button>
      </form>
    </div>
  )
}
