import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import Stripe from "npm:stripe"

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? 'https://groundwork.vercel.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })

  const { invoiceId } = await req.json()
  if (!invoiceId) {
    return new Response(JSON.stringify({ error: 'invoiceId is required' }),
      { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, clients(name, email)')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }),
      { status: 404, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }

  if (invoice.status !== 'sent') {
    return new Response(
      JSON.stringify({ error: `Invoice is ${invoice.status}, payment not available` }),
      { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_account_id')
    .eq('id', invoice.user_id)
    .single()

  if (!profile?.stripe_account_id) {
    return new Response(JSON.stringify({ error: 'stripe_not_connected' }),
      { status: 400, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: invoice.total,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { invoiceId },
      application_fee_amount: 0,
      receipt_email: invoice.clients?.email ?? undefined,
    },
    { stripeAccount: profile.stripe_account_id, idempotencyKey: `invoice_${invoiceId}` }
  )

  return new Response(
    JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      stripeAccountId: profile.stripe_account_id,
    }),
    { headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
  )
})
