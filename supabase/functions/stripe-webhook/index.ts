import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "npm:stripe"

Deno.serve(async (req: Request) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  if (event.type !== 'payment_intent.succeeded') {
    return new Response('OK', { status: 200 })
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const invoiceId = paymentIntent.metadata?.invoiceId
  if (!invoiceId) return new Response('No invoiceId', { status: 200 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch invoice to validate before updating
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, status, total')
    .eq('id', invoiceId)
    .single()

  if (fetchError || !invoice) {
    console.error('Invoice not found for webhook:', invoiceId)
    return new Response('Invoice not found', { status: 200 })
  }

  if (invoice.status === 'paid') {
    return new Response('Already paid', { status: 200 })
  }

  if (paymentIntent.amount !== invoice.total) {
    console.error(`Amount mismatch: Stripe=${paymentIntent.amount}, invoice=${invoice.total}`)
    return new Response('Amount mismatch', { status: 200 })
  }

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', invoiceId)

  if (updateError) {
    console.error('Failed to update invoice:', updateError)
    return new Response('Update failed', { status: 500 })
  }

  return new Response('OK', { status: 200 })
})
