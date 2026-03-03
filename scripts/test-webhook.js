/**
 * Automated webhook integration test.
 *
 * Sends a properly signed `payment_intent.succeeded` webhook payload directly
 * to the deployed Edge Function, then verifies the invoice was marked as paid.
 * No Stripe CLI needed — the signature is computed locally using the webhook secret.
 *
 * Prerequisites:
 *   Add to .env.local:
 *     SUPABASE_SERVICE_ROLE_KEY=<your service role key>
 *     STRIPE_WEBHOOK_SECRET=<whsec_... from Stripe Dashboard>
 *
 * Usage:
 *   npm run test:webhook
 */

import { createHmac } from 'node:crypto'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!SUPABASE_URL || !SERVICE_KEY || !WEBHOOK_SECRET) {
  console.error('ERROR: Missing required env vars.')
  console.error('Ensure .env.local has: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_WEBHOOK_SECRET')
  process.exit(1)
}

const supabaseHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

async function fetchSentInvoice() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/invoices?status=eq.sent&select=id,invoice_number,total&limit=1`,
    { headers: supabaseHeaders }
  )
  const data = await res.json()
  return data[0] ?? null
}

async function getInvoiceStatus(id) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}&select=status`,
    { headers: supabaseHeaders }
  )
  const data = await res.json()
  return data[0]?.status
}

async function resetInvoice(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
    method: 'PATCH',
    headers: supabaseHeaders,
    body: JSON.stringify({ status: 'sent', paid_at: null }),
  })
}

function signPayload(payload) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${timestamp}.${payload}`)
    .digest('hex')
  return `t=${timestamp},v1=${signature}`
}

// ── Main ─────────────────────────────────────────────────────────────────────

const invoice = await fetchSentInvoice()
if (!invoice) {
  console.error('ERROR: No "sent" invoices found. Create and send one in the app first.')
  process.exit(1)
}

console.log(`\nTesting webhook with invoice #${invoice.invoice_number} (${invoice.id})`)

const payload = JSON.stringify({
  id: 'evt_test_webhook',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_webhook',
      object: 'payment_intent',
      amount: invoice.total,
      status: 'succeeded',
      metadata: { invoiceId: invoice.id },
    },
  },
})

console.log('Sending signed payment_intent.succeeded to webhook...')
const webhookRes = await fetch(`${SUPABASE_URL}/functions/v1/stripe-webhook`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'stripe-signature': signPayload(payload),
  },
  body: payload,
})

const webhookBody = await webhookRes.text()
console.log(`Webhook responded: ${webhookRes.status} ${webhookBody}`)

if (!webhookRes.ok) {
  console.error(`\nFAIL: webhook returned ${webhookRes.status}`)
  process.exit(1)
}

// Give the DB update a moment, then check
await new Promise(r => setTimeout(r, 1000))
const status = await getInvoiceStatus(invoice.id)

if (status === 'paid') {
  console.log(`\nPASS: invoice #${invoice.invoice_number} marked paid`)
  await resetInvoice(invoice.id)
  console.log('Invoice reset to "sent" — ready to run again')
  process.exit(0)
} else {
  console.error(`\nFAIL: invoice status is "${status}", expected "paid"`)
  process.exit(1)
}
