import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
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

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

const stripeAppearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#16a34a',
    colorBackground: '#ffffff',
    colorText: '#0a0a0a',
    colorDanger: '#ef4444',
    fontFamily: 'system-ui, sans-serif',
    borderRadius: '6px',
    fontSizeBase: '14px',
  },
  rules: {
    '.Input': { border: '1px solid #e5e5e5', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #16a34a', boxShadow: 'none' },
  },
}

// ---------------------------------------------------------------------------
// PaymentForm — must be inside <Elements> to use useStripe/useElements
// ---------------------------------------------------------------------------
function PaymentForm({ invoiceId, onSuccess }: { invoiceId: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements) return

    setPaying(true)
    setPayError(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/i/${invoiceId}?paid=1`,
      },
      // Standard cards stay on page; 3DS cards redirect to bank then return
      redirect: 'if_required',
    })

    if (error) {
      setPayError(error.message ?? 'Payment failed. Please try again.')
      setPaying(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess()
    }

    setPaying(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {payError && (
        <p className="text-sm text-red-600" role="alert">{payError}</p>
      )}
      <button
        type="submit"
        disabled={paying || !stripe}
        className={cn(
          'w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white',
          (paying || !stripe) ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
        )}
      >
        {paying ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------
function statusClass(status: Invoice['status']) {
  if (status === 'paid') return 'bg-green-600 text-white hover:bg-green-700'
  if (status === 'sent') return 'bg-blue-600 text-white hover:bg-blue-700'
  return ''
}

// ---------------------------------------------------------------------------
// InvoicePublic — main page component
// ---------------------------------------------------------------------------
export default function InvoicePublic() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Payment flow state
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripeInstance, setStripeInstance] = useState<ReturnType<typeof loadStripe> | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  // ?paid=1 — client returned here after 3DS redirect
  const justPaid = searchParams.get('paid') === '1'

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

  async function handlePayWithCard() {
    setLoadingIntent(true)
    setIntentError(null)

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { invoiceId: id },
    })

    if (error || !data?.clientSecret) {
      setIntentError('Could not start checkout. Please try another payment method.')
      setLoadingIntent(false)
      return
    }

    setClientSecret(data.clientSecret)
    setStripeInstance(loadStripe(STRIPE_KEY, { stripeAccount: data.stripeAccountId }))
    setLoadingIntent(false)
  }

  if (loading) return null

  if (notFound || !invoice || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    )
  }

  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
  const isPaid = invoice.status === 'paid' || justPaid || paymentSuccess

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6 space-y-8">

        {(justPaid || paymentSuccess) && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
            Payment received — thank you!
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-green-600">Groundwork</span>
          <Badge className={cn(statusClass(isPaid ? 'paid' : invoice.status))}>{isPaid ? 'paid' : invoice.status}</Badge>
        </div>

        <div className="space-y-1">
          <p className="text-3xl font-semibold">Invoice #{invoice.invoice_number}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(invoice.created_at).toLocaleDateString('en-US')}
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

        {!isPaid && (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm font-medium">Payment options</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>E-Transfer accepted</p>
              <p>Cash accepted</p>
            </div>

            {/* Step 1: button to trigger payment intent creation */}
            {!clientSecret && (
              <>
                {intentError && (
                  <p className="text-sm text-red-600" role="alert">{intentError}</p>
                )}
                <button
                  onClick={handlePayWithCard}
                  disabled={loadingIntent}
                  className={cn(
                    'w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white',
                    loadingIntent ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
                  )}
                >
                  {loadingIntent ? 'Loading…' : 'Pay with Card'}
                </button>
              </>
            )}

            {/* Step 2: embedded card form once clientSecret is ready */}
            {clientSecret && stripeInstance && (
              <Elements
                stripe={stripeInstance}
                options={{ clientSecret, appearance: stripeAppearance }}
              >
                <PaymentForm
                  invoiceId={id!}
                  onSuccess={() => setPaymentSuccess(true)}
                />
              </Elements>
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">Thank you for your business</p>
      </div>
    </div>
  )
}
