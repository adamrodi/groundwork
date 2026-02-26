import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
import type { Invoice, Client, LineItem } from '@/lib/types'

function statusClass(status: Invoice['status']) {
  if (status === 'paid') return 'bg-green-600 text-white hover:bg-green-700'
  if (status === 'sent') return 'bg-blue-600 text-white hover:bg-blue-700'
  return ''
}

export default function InvoicePublic() {
  const { id } = useParams<{ id: string }>()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !invoiceData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const inv = invoiceData as Invoice
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

  if (loading) return null

  if (notFound || !invoice || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    )
  }

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-600">Groundwork</span>
          <Badge className={cn(statusClass(invoice.status))}>{invoice.status}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-semibold">Invoice #{invoice.invoice_number}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(invoice.created_at).toLocaleDateString('en-CA')}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bill To</p>
          <p className="font-medium">{client.name}</p>
          {client.phone && <p className="text-sm text-muted-foreground">{client.phone}</p>}
          {client.email && <p className="text-sm text-muted-foreground">{client.email}</p>}
          {client.address && <p className="text-sm text-muted-foreground">{client.address}</p>}
        </div>

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
              <TableCell colSpan={3} className="text-right font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold text-lg">
                {formatCents(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm font-medium">Payment options</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>E-Transfer accepted</p>
            <p>Cash accepted</p>
          </div>
          <button
            disabled
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white opacity-40 cursor-not-allowed"
          >
            Pay with Card (coming soon)
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">Thank you for your business</p>
      </div>
    </div>
  )
}
