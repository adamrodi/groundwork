import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn, formatCents } from '@/lib/utils'
import type { Job, LineItem } from '@/lib/types'

type JobWithClient = Job & { clients: { name: string } }

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [job, setJob] = useState<JobWithClient | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [jobResult, lineItemsResult] = await Promise.all([
        supabase.from('jobs').select('*, clients(name)').eq('id', id).single(),
        supabase.from('line_items').select('*').eq('job_id', id),
      ])
      if (jobResult.error || !jobResult.data) {
        setNotFound(true)
      } else {
        setJob(jobResult.data as JobWithClient)
        setLineItems((lineItemsResult.data as LineItem[]) ?? [])
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleMarkComplete() {
    setSaving(true)
    await supabase.from('jobs').update({ status: 'complete' }).eq('id', id)
    setJob(prev => (prev ? { ...prev, status: 'complete' } : prev))
    setSaving(false)
  }

  async function handleCreateInvoice() {
    setSaving(true)
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('job_id', id)
      .maybeSingle()

    if (existing) {
      navigate(`/invoices/${(existing as { id: string }).id}`)
      return
    }

    const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        user_id: user!.id,
        job_id: id,
        client_id: job!.client_id,
        status: 'draft',
        total: Math.round(total),
      })
      .select()
      .single()

    if (invoice) {
      navigate(`/invoices/${(invoice as { id: string }).id}`)
    }
    setSaving(false)
  }

  if (loading) return null

  if (notFound || !job) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <Link to="/jobs" className="text-sm text-muted-foreground hover:underline">
          ← Back
        </Link>
        <p className="mt-4">Job not found.</p>
      </div>
    )
  }

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link to="/jobs" className="text-sm text-muted-foreground hover:underline">
        ← Back
      </Link>

      <div className="space-y-1">
        <Link
          to={`/clients/${job.client_id}`}
          className="text-lg font-semibold hover:underline"
        >
          {job.clients.name}
        </Link>
        <p className="text-sm text-muted-foreground">{job.date}</p>
      </div>

      {job.description && <p>{job.description}</p>}

      <div className="flex items-center gap-3">
        <Badge
          className={cn(
            job.status === 'complete' && 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          {job.status}
        </Badge>
        {job.status === 'pending' && (
          <Button variant="outline" size="sm" disabled={saving} onClick={handleMarkComplete}>
            Mark Complete
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Line Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineItems.map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.quantity}</TableCell>
              <TableCell className="text-right">{formatCents(item.unit_price)}</TableCell>
              <TableCell className="text-right">
                {formatCents(item.quantity * item.unit_price)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="text-right font-medium">{formatCents(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {job.status === 'complete' && (
        <Button disabled={saving} onClick={handleCreateInvoice}>
          Create Invoice
        </Button>
      )}
    </div>
  )
}
