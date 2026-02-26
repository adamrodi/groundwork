# Phase 4 — Invoices

**Status:** not started
**Prerequisites:** Phase 1 (Auth), Phase 2 (Clients), Phase 3 (Jobs)

## Goal

Salim can view a generated invoice, preview/download it as a PDF, send it to the client via SMS (iMessage deep link) or email (Resend via Edge Function), and mark it as paid. Clients can view a public version of the invoice at `/i/:id` without logging in.

## Files

Create:
- `src/components/InvoicePDF.tsx` — react-pdf Document component
- `src/pages/InvoicePublic.tsx` — client-facing public invoice page
- `supabase/functions/send-invoice/index.ts` — Edge Function to send email via Resend

Modify:
- `src/pages/Invoices.tsx` — list all invoices
- `src/pages/InvoiceDetail.tsx` — view, send, mark paid
- `src/App.tsx` — add `/i/:id` route (no ProtectedRoute wrapper)

## Dependencies to install

```bash
npm install resend   # in the Edge Function (Deno import, not npm — see below)
```

Resend is used inside the Deno Edge Function via a URL import — no npm install needed in the React app. The React app just calls the Edge Function.

## New RLS policy needed

The public invoice page reads invoices without authentication. Add a Supabase migration:

```sql
-- Allow anyone to read a single invoice by ID (for public invoice view)
-- The UUID serves as the access token for MVP
CREATE POLICY "public read invoice by id"
  ON invoices
  FOR SELECT
  TO anon
  USING (true);
```

Apply this via `supabase.apply_migration` before building `InvoicePublic.tsx`.

Note: This allows any anon user to read any invoice if they know the ID. UUID v4 is 122 bits of entropy — acceptable for MVP. Post-MVP, add a signed token.

## Environment variables

Add to `.env.local` and to Supabase Edge Function secrets:
- `RESEND_API_KEY` — get from resend.com dashboard
- `VITE_APP_URL` — base URL for public invoice links (e.g. `http://localhost:5173` in dev, `https://groundwork.vercel.app` in prod)

Set Edge Function secret:
```bash
supabase secrets set RESEND_API_KEY=re_xxx
```

## Implementation

### 1. `src/components/InvoicePDF.tsx`

Uses `@react-pdf/renderer`. Export a `InvoicePDF` component and a `downloadInvoicePDF(invoice, client, lineItems)` helper.

```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

type InvoicePDFProps = {
  invoice: Invoice
  client: Client
  lineItems: LineItem[]
  businessName?: string
}
```

Document layout (top to bottom):
- Business name (large, green: '#16a34a')
- Horizontal rule
- Two columns: "INVOICE" label + number on left, Date on right
- "Bill To" section: client name, phone, email, address
- Line items table: Description | Qty | Unit Price | Total
- Horizontal rule
- Total row right-aligned
- Footer: "Thank you for your business"

Styles use `StyleSheet.create({})`. Font size 10-12pt for body, 18-20pt for headings.

`downloadInvoicePDF`: uses `pdf(<InvoicePDF .../>).toBlob()` then creates an object URL and triggers a download. Import `pdf` from `@react-pdf/renderer`.

### 2. `src/pages/Invoices.tsx`

State: `invoices: (Invoice & { clients: { name: string } })[]`, `loading: boolean`

Fetch:
```ts
const { data } = await supabase
  .from('invoices')
  .select('*, clients(name)')
  .order('created_at', { ascending: false })
```

Layout:
- Page header: "Invoices" h1
- Table columns: #Number, Client, Total (formatCents), Status badge, Date
- Row click navigates to `/invoices/:id`

Status badge colors: `draft` → gray/secondary, `sent` → blue, `paid` → green

### 3. `src/pages/InvoiceDetail.tsx`

URL param: `id`

State:
- `invoice: Invoice | null`
- `client: Client | null`
- `lineItems: LineItem[]`
- `loading: boolean`
- `sending: boolean` (email send in progress)

Fetch on mount:
```ts
const { data: invoice } = await supabase
  .from('invoices')
  .select('*, clients(*), jobs(description, date)')
  .eq('id', id)
  .single()

const { data: lineItems } = await supabase
  .from('line_items')
  .select('*')
  .eq('job_id', invoice.job_id)
```

Layout:
- Back link to `/invoices`
- Invoice number as h1 (e.g. "Invoice #42")
- Status badge + date
- Client info: name, phone, email
- Job description + date (if attached)
- Line items table (same columns as JobDetail)
- Total

Action buttons (shown based on status):
- "Download PDF" — always visible — calls `downloadInvoicePDF(invoice, client, lineItems)`
- "Copy public link" — copies `${VITE_APP_URL}/i/${id}` to clipboard using `navigator.clipboard.writeText()`
- "Send via SMS" — visible if client has a phone number — opens:
  ```ts
  const body = encodeURIComponent(`Hi ${client.name}, here's your invoice: ${appUrl}/i/${id}`)
  window.open(`sms:${client.phone}?body=${body}`)
  ```
  Then update: `supabase.from('invoices').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id)`
- "Send via Email" — visible if client has an email — calls Edge Function (see below), then updates status to 'sent'
- "Mark as Paid" — visible if status is 'sent' — updates `{ status: 'paid', paid_at: new Date().toISOString() }`

All status updates refresh local state after success.

Calling the Edge Function:
```ts
const { error } = await supabase.functions.invoke('send-invoice', {
  body: { invoiceId: id }
})
```

### 4. `supabase/functions/send-invoice/index.ts`

Create the directory `supabase/functions/send-invoice/` first.

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { Resend } from "npm:resend"

Deno.serve(async (req: Request) => {
  const { invoiceId } = await req.json()

  // Use service role key — Edge Functions have access to SUPABASE_SERVICE_ROLE_KEY automatically
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', invoiceId)
    .single()

  if (!invoice || !invoice.clients?.email) {
    return new Response(JSON.stringify({ error: 'Invoice or client email not found' }), { status: 400 })
  }

  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
  const appUrl = Deno.env.get('APP_URL') ?? 'https://groundwork.vercel.app'

  await resend.emails.send({
    from: 'Groundwork <invoices@yourdomain.com>',  // replace with verified Resend sender
    to: invoice.clients.email,
    subject: `Invoice #${invoice.invoice_number} from Groundwork`,
    html: `
      <p>Hi ${invoice.clients.name},</p>
      <p>Please find your invoice here: <a href="${appUrl}/i/${invoiceId}">${appUrl}/i/${invoiceId}</a></p>
      <p>Total: $${(invoice.total / 100).toFixed(2)}</p>
    `
  })

  // Update invoice status
  await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', invoiceId)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

The `from` address must be a verified sender domain in Resend. For MVP, use Resend's default sandbox sender (`onboarding@resend.dev`) for testing.

Deploy the function:
```bash
supabase functions deploy send-invoice
```

### 5. `src/pages/InvoicePublic.tsx`

No auth required. This page needs to work for the client without a Supabase session.

URL param: `id`

Fetch using the anon key (default supabase client is fine — RLS policy allows anon reads):
```ts
const { data: invoice } = await supabase
  .from('invoices')
  .select('*, clients(*)')
  .eq('id', id)
  .single()

const { data: lineItems } = await supabase
  .from('line_items')
  .select('*')
  .eq('job_id', invoice?.job_id)
```

Layout: clean, client-facing invoice view. No nav bar. Show:
- Groundwork logo/wordmark at top
- Invoice number, date, status
- Client name and address
- Line items table
- Total
- "Pay with Card" button — placeholder for Phase 5 (show as disabled or hidden in this phase)
- Payment options: "E-Transfer to [email]" and "Cash accepted" — these are free options Salim offers

### 6. `src/App.tsx` changes

Add the public route — no ProtectedRoute:
```tsx
<Route path="/i/:id" element={<InvoicePublic />} />
```

## Done when

- `/invoices` lists all invoices with status and total
- `/invoices/:id` shows full invoice detail with line items
- "Download PDF" generates and downloads a PDF
- "Send via SMS" opens iMessage with the public link and updates status to 'sent'
- "Send via Email" calls the Edge Function, client receives an email, status updates to 'sent'
- "Mark as Paid" updates status to 'paid' with timestamp
- `/i/:id` is accessible without login and shows the invoice
- "Copy public link" copies the correct URL to clipboard
