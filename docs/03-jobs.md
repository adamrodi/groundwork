# Phase 3 — Jobs

**Status:** not started
**Prerequisites:** Phase 1 (Auth), Phase 2 (Clients)

## Goal

Salim can create a job for a client, attach line items (services and materials with quantities and prices), mark it complete, and generate an invoice from it.

## Files

Create:
- `src/components/LineItemsEditor.tsx` — add/remove/edit line items rows

Modify:
- `src/pages/Jobs.tsx` — list all jobs
- `src/pages/JobNew.tsx` — create job form
- `src/pages/JobDetail.tsx` — view job, manage status, create invoice

## New shadcn components to add

```bash
npx shadcn@latest add select
```

(`textarea` should already be added from Phase 2)

## Utility to add in `src/lib/utils.ts`

```ts
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })
}
```

Use this everywhere money is displayed.

## Implementation

### 1. `src/components/LineItemsEditor.tsx`

Manages an array of line item drafts. This is a controlled component — parent owns the state.

```ts
type LineItemDraft = {
  description: string
  quantity: string   // string for input binding, parse to number on submit
  unit_price: string // string in dollars (e.g. "75.00"), convert to cents on submit
}

type LineItemsEditorProps = {
  items: LineItemDraft[]
  onChange: (items: LineItemDraft[]) => void
}
```

Layout: a table-like list of rows. Each row has:
- Description — Input (flex-grow)
- Qty — Input type="number", min="0.01", step="0.01", width ~16
- Unit Price — Input type="number", prefix "$", width ~24
- Remove button (X icon, ghost variant)

Below the rows: "Add line item" button (outline variant).

Show a running subtotal below the list: sum of `(parseFloat(qty) || 0) * (parseFloat(unit_price) * 100 || 0)` — display with `formatCents`. Label it "Total".

### 2. `src/pages/Jobs.tsx`

State: `jobs: (Job & { clients: { name: string } })[]`, `loading: boolean`

Fetch:
```ts
const { data } = await supabase
  .from('jobs')
  .select('*, clients(name)')
  .order('date', { ascending: false })
```

Layout:
- Page header: "Jobs" h1, "New Job" Button (link to /jobs/new) top-right
- Table columns: Client (name), Description (truncated to ~40 chars), Date (formatted), Status badge
- Row click navigates to `/jobs/:id`

Status badge: `pending` → Badge variant default (or secondary), `complete` → custom green styling via `cn()`.

### 3. `src/pages/JobNew.tsx`

State:
- `clients: { id: string, name: string }[]`
- `clientId: string`
- `description: string`
- `date: string` (ISO date string, defaults to today: `new Date().toISOString().split('T')[0]`)
- `lineItems: LineItemDraft[]` (starts with one empty row)
- `saving: boolean`
- `error: string | null`

On mount, fetch clients for the select:
```ts
const { data } = await supabase
  .from('clients')
  .select('id, name')
  .order('name')
```

Check for `?client_id=` query param (`useSearchParams()`) — if present, pre-select that client.

Form fields:
- Client — Select component (required). If no clients exist, show a message "Add a client first" with a link to /clients.
- Description — Textarea, optional (e.g. "Lawn mowing, front and back")
- Date — Input type="date", required, defaults to today
- Line items — `<LineItemsEditor>`

Submit handler:
1. Validate: client selected, at least one line item with a description and price
2. Calculate total: sum of `quantity * unit_price_in_cents` for each line item
3. Insert job:
```ts
const { data: job } = await supabase
  .from('jobs')
  .insert({ user_id: user!.id, client_id: clientId, description, date, status: 'pending' })
  .select()
  .single()
```
4. Insert line items:
```ts
await supabase.from('line_items').insert(
  lineItems.map(item => ({
    job_id: job.id,
    description: item.description,
    quantity: parseFloat(item.quantity),
    unit_price: Math.round(parseFloat(item.unit_price) * 100),
  }))
)
```
5. Navigate to `/jobs/${job.id}`

### 4. `src/pages/JobDetail.tsx`

URL param: `id`

State:
- `job: Job & { clients: { name: string } } | null`
- `lineItems: LineItem[]`
- `loading: boolean`
- `saving: boolean` (for status updates / invoice creation)

Fetch on mount (parallel):
```ts
const [jobResult, lineItemsResult] = await Promise.all([
  supabase.from('jobs').select('*, clients(name)').eq('id', id).single(),
  supabase.from('line_items').select('*').eq('job_id', id)
])
```

Layout:
- Back link to `/jobs`
- Client name (link to `/clients/:client_id`) + job date
- Description (if present)
- Status badge + "Mark Complete" button (only visible if status is 'pending'):
  ```ts
  await supabase.from('jobs').update({ status: 'complete' }).eq('id', id)
  ```
  Then update local state.
- Line items table: Description, Qty, Unit Price, Line Total (qty × price)
- Total row at bottom
- "Create Invoice" button (visible only when status is 'complete' — enforce this in the UI):
  1. Check if an invoice already exists for this job:
     ```ts
     const { data: existing } = await supabase
       .from('invoices')
       .select('id')
       .eq('job_id', id)
       .maybeSingle()
     ```
  2. If exists, navigate to `/invoices/${existing.id}`
  3. If not, insert invoice:
     ```ts
     const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)
     const { data: invoice } = await supabase
       .from('invoices')
       .insert({
         user_id: user!.id,
         job_id: id,
         client_id: job.client_id,
         status: 'draft',
         total: Math.round(total),
       })
       .select()
       .single()
     ```
  4. Navigate to `/invoices/${invoice.id}`

## Done when

- `/jobs` shows all jobs with client name, description, date, status
- `/jobs/new` creates a job with line items and redirects to detail
- `/jobs/new?client_id=:id` pre-selects the correct client
- `/jobs/:id` shows job info and line items with totals
- "Mark Complete" changes status and hides the button
- "Create Invoice" creates a draft invoice and navigates to it (or navigates to existing invoice if already created)
