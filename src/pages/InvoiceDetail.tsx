import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
import { downloadInvoicePDF } from '@/components/InvoicePDF'
import type { Invoice, Client, LineItem } from '@/lib/types'

type InvoiceWithJob = Invoice & { jobs: { description: string | null; date: string | null } | null }

function statusClass(status: Invoice['status']) {
  if (status === 'paid') return 'bg-green-600 text-white hover:bg-green-700'
  if (status === 'sent') return 'bg-blue-600 text-white hover:bg-blue-700'
  return ''
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>()

  const [invoice, setInvoice] = useState<InvoiceWithJob | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin

  useEffect(() => {
    async function fetchData() {
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*, jobs(description, date)')
        .eq('id', id)
        .single()

      if (error || !invoiceData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const inv = invoiceData as InvoiceWithJob
      setInvoice(inv)

      const [clientResult, lineItemsResult] = await Promise.all([
        supabase.from('clients').select('*').eq('id', inv.client_id).single(),
        supabase.from('line_items').select('*').eq('job_id', inv.job_id),
      ])

      if (clientResult.data) setClient(clientResult.data as Client)
      setLineItems((lineItemsResult.data as LineItem[]) ?? [])
      setLoading(false)
    }
    fetchData()
  }, [id])

  async function handleDownloadPDF() {
    if (!invoice || !client) return
    await downloadInvoicePDF(invoice, client, lineItems)
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${appUrl}/i/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSendSMS() {
    if (!client?.phone || !invoice) return
    const body = encodeURIComponent(`Hi ${client.name}, here's your invoice: ${appUrl}/i/${id}`)
    window.open(`sms:${client.phone}?body=${body}`)
    const { data } = await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (data) setInvoice(prev => prev ? { ...prev, ...(data as InvoiceWithJob) } : prev)
  }

  async function handleSendEmail() {
    setSending(true)
    const { error } = await supabase.functions.invoke('send-invoice', {
      body: { invoiceId: id },
    })
    if (!error) {
      setInvoice(prev => prev ? { ...prev, status: 'sent', sent_at: new Date().toISOString() } : prev)
    }
    setSending(false)
  }

  async function handleMarkPaid() {
    setSaving(true)
    const { data } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (data) setInvoice(prev => prev ? { ...prev, ...(data as InvoiceWithJob) } : prev)
    setSaving(false)
  }

  if (loading) return null

  if (notFound || !invoice || !client) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <Link to="/invoices" className="text-sm text-muted-foreground hover:underline">
          ← Back
        </Link>
        <p className="mt-4">Invoice not found.</p>
      </div>
    )
  }

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Link to="/invoices" className="text-sm text-muted-foreground hover:underline">
        ← Back
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Invoice #{invoice.invoice_number}</h1>
          <Badge className={cn(statusClass(invoice.status))}>{invoice.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(invoice.created_at).toLocaleDateString('en-US')}
        </p>
      </div>

      <div className="space-y-1">
        <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
          {client.name}
        </Link>
        {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
        {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
        {client.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
      </div>

      {invoice.jobs && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Job</p>
          {invoice.jobs.description && <p>{invoice.jobs.description}</p>}
          {invoice.jobs.date && (
            <p className="text-sm text-muted-foreground">{invoice.jobs.date}</p>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
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

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleDownloadPDF}>
          Download PDF
        </Button>

        <Button variant="outline" onClick={handleCopyLink}>
          {copied ? 'Copied!' : 'Copy public link'}
        </Button>

        {client.phone && invoice.status === 'draft' && (
          <Button variant="outline" onClick={handleSendSMS}>
            Send via SMS
          </Button>
        )}

        {client.email && invoice.status === 'draft' && (
          <Button variant="outline" disabled={sending} onClick={handleSendEmail}>
            {sending ? 'Sending…' : 'Send via Email'}
          </Button>
        )}

        {invoice.status === 'sent' && (
          <Button disabled={saving} onClick={handleMarkPaid}>
            {saving ? 'Saving…' : 'Mark as Paid'}
          </Button>
        )}
      </div>
    </div>
  )
}
