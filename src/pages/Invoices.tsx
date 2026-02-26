import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import type { Invoice } from '@/lib/types'

type InvoiceWithClient = Invoice & { clients: { name: string } }

function statusClass(status: Invoice['status']) {
  if (status === 'paid') return 'bg-green-600 text-white hover:bg-green-700'
  if (status === 'sent') return 'bg-blue-600 text-white hover:bg-blue-700'
  return ''
}

export default function Invoices() {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      const { data } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .order('created_at', { ascending: false })
      setInvoices((data as InvoiceWithClient[]) ?? [])
      setLoading(false)
    }
    fetchInvoices()
  }, [])

  if (loading) return null

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>

      {invoices.length === 0 ? (
        <p className="text-muted-foreground">No invoices yet. Create one from a completed job.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow
                key={invoice.id}
                className="cursor-pointer"
                onClick={() => navigate(`/invoices/${invoice.id}`)}
              >
                <TableCell className="font-medium">#{invoice.invoice_number}</TableCell>
                <TableCell>{invoice.clients.name}</TableCell>
                <TableCell className="text-right">{formatCents(invoice.total)}</TableCell>
                <TableCell>
                  <Badge className={cn(statusClass(invoice.status))}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.created_at).toLocaleDateString('en-CA')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
