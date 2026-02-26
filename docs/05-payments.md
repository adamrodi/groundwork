# Phase 5 — Payments

**Status:** not started
**Prerequisites:** Phase 4 (Invoices) complete

## Goal

Clients can pay an invoice by card via Square Checkout directly from the public invoice page. Salim is notified when payment is received, and the invoice is automatically marked as paid via a Square webhook.

## Context: Salim's current payment setup

Salim currently collects payments three ways:
- **Card / tap-to-pay** — uses the Square POS app on his phone at the job site
- **E-transfer** — client sends to his email
- **Cash** — on the spot

Phase 5 adds a fourth option: the client pays online via a link Salim sends. This is card-only via Square Checkout. The other methods (e-transfer, cash) are already shown on the public invoice page as informational text.

## Square setup required before building

1. Create a Square developer account at developer.squareup.com
2. Create an application in the Square dashboard
3. Get credentials: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`
4. Set Edge Function secrets:
   ```bash
   supabase secrets set SQUARE_ACCESS_TOKEN=...
   supabase secrets set SQUARE_LOCATION_ID=...
   supabase secrets set SQUARE_WEBHOOK_SIGNATURE_KEY=...
   ```
5. Register the webhook URL in Square dashboard pointing to the deployed Edge Function URL:
   `https://<project-ref>.supabase.co/functions/v1/square-webhook`
6. Subscribe to the `payment.completed` event

## Files

Create:
- `supabase/functions/create-square-checkout/index.ts` — creates a Square Checkout link
- `supabase/functions/square-webhook/index.ts` — handles Square payment.completed webhook

Modify:
- `src/pages/InvoicePublic.tsx` — activate the "Pay with Card" button

## How the flow works

1. Client opens `/i/:id`
2. Client clicks "Pay with Card"
3. Frontend calls Edge Function `create-square-checkout` with the invoice ID
4. Edge Function calls Square API to create a Checkout link with the correct amount
5. Frontend redirects client to the Square-hosted checkout page
6. Client pays on Square's page
7. Square fires `payment.completed` webhook to `square-webhook` Edge Function
8. Edge Function verifies signature, finds the invoice by the reference ID passed in step 4, updates status to 'paid'

## Implementation

### 1. `supabase/functions/create-square-checkout/index.ts`

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

Deno.serve(async (req: Request) => {
  const { invoiceId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404 })
  }

  const accessToken = Deno.env.get('SQUARE_ACCESS_TOKEN')!
  const locationId = Deno.env.get('SQUARE_LOCATION_ID')!
  const appUrl = Deno.env.get('APP_URL') ?? 'https://groundwork.vercel.app'

  const body = {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: locationId,
      reference_id: invoiceId,  // used to match the webhook back to this invoice
      line_items: [{
        name: `Invoice #${invoice.invoice_number}`,
        quantity: '1',
        base_price_money: {
          amount: invoice.total,  // already in cents
          currency: 'CAD'
        }
      }]
    },
    checkout_options: {
      redirect_url: `${appUrl}/i/${invoiceId}?paid=1`,
      ask_for_shipping_address: false,
    },
    pre_populated_data: {
      buyer_email: invoice.clients?.email ?? undefined,
    }
  }

  const response = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': '2024-01-18',
    },
    body: JSON.stringify(body)
  })

  const result = await response.json()

  if (!response.ok) {
    return new Response(JSON.stringify({ error: result }), { status: 500 })
  }

  return new Response(
    JSON.stringify({ url: result.payment_link.url }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Deploy: `supabase functions deploy create-square-checkout`

### 2. `supabase/functions/square-webhook/index.ts`

Square signs all webhook requests. Verify the signature before processing.

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { createHmac } from "node:crypto"

Deno.serve(async (req: Request) => {
  const body = await req.text()
  const signature = req.headers.get('x-square-hmacsha256-signature') ?? ''
  const signatureKey = Deno.env.get('SQUARE_WEBHOOK_SIGNATURE_KEY')!
  const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/square-webhook`

  // Verify Square webhook signature
  const expected = createHmac('sha256', signatureKey)
    .update(webhookUrl + body)
    .digest('base64')

  if (signature !== expected) {
    return new Response('Invalid signature', { status: 403 })
  }

  const event = JSON.parse(body)

  if (event.type !== 'payment.completed') {
    return new Response('OK', { status: 200 })  // ignore other events
  }

  const referenceId = event.data?.object?.payment?.order_id
    ? await getOrderReferenceId(event, Deno.env.get('SQUARE_ACCESS_TOKEN')!)
    : null

  if (!referenceId) {
    return new Response('No reference ID', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', referenceId)

  return new Response('OK', { status: 200 })
})

// Square payment.completed doesn't include reference_id directly —
// need to fetch the order to get it
async function getOrderReferenceId(event: unknown, accessToken: string): Promise<string | null> {
  const orderId = (event as { data: { object: { payment: { order_id: string } } } })
    .data?.object?.payment?.order_id
  if (!orderId) return null

  const res = await fetch(`https://connect.squareup.com/v2/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Square-Version': '2024-01-18' }
  })
  const data = await res.json()
  return data.order?.reference_id ?? null
}
```

Deploy: `supabase functions deploy square-webhook --no-verify-jwt`

Note `--no-verify-jwt`: Square calls this endpoint without a Supabase JWT. The Square signature verification is the auth mechanism instead.

### 3. `src/pages/InvoicePublic.tsx` changes

Replace the placeholder "Pay with Card" button with a real one:

```tsx
const [loadingCheckout, setLoadingCheckout] = useState(false)

async function handlePayWithCard() {
  setLoadingCheckout(true)
  const { data, error } = await supabase.functions.invoke('create-square-checkout', {
    body: { invoiceId: id }
  })
  if (error || !data?.url) {
    setLoadingCheckout(false)
    // show error
    return
  }
  window.location.href = data.url
}
```

Check for `?paid=1` query param on mount — if present, show a "Payment received — thank you!" banner.

## Done when

- "Pay with Card" button on the public invoice page redirects to Square Checkout
- Completing payment on Square redirects back to `/i/:id?paid=1` with a success banner
- The invoice is automatically marked as `paid` in the database after Square fires the webhook
- Webhook signature verification prevents spoofed events
