# Phase 2 — Clients

**Status:** complete
**Prerequisites:** Phase 1 (Auth) complete

## Goal

Salim can add clients (name, phone, email, address), view a list of all clients, and drill into a client to see their details and job history.

## Files

Create:
- `src/components/ClientForm.tsx` — reusable create/edit form used in both pages

Modify:
- `src/pages/Clients.tsx` — list + create
- `src/pages/ClientDetail.tsx` — view + edit + job history

## New shadcn components to add

```bash
npx shadcn@latest add dialog
npx shadcn@latest add textarea
```

## Types

Define in `src/lib/types.ts` (create this file — shared types for the whole app):

```ts
export type Client = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export type Job = {
  id: string
  user_id: string
  client_id: string
  description: string | null
  date: string | null
  status: 'pending' | 'complete'
  created_at: string
}

export type LineItem = {
  id: string
  job_id: string
  description: string
  quantity: number
  unit_price: number  // cents
}

export type Invoice = {
  id: string
  user_id: string
  job_id: string | null
  client_id: string
  invoice_number: number
  status: 'draft' | 'sent' | 'paid'
  total: number  // cents
  sent_at: string | null
  paid_at: string | null
  created_at: string
}
```

Add all four types now so later phases can import them.

## Implementation

### 1. `src/components/ClientForm.tsx`

Props:
```ts
type ClientFormProps = {
  initialData?: Partial<Client>
  onSubmit: (data: Omit<Client, 'id' | 'user_id' | 'created_at'>) => Promise<void>
  onCancel: () => void
  loading: boolean
}
```

Fields:
- Name — Input, required
- Phone — Input, type="tel", optional
- Email — Input, type="email", optional
- Address — Textarea, optional

Show a loading state on the submit button. Display a generic error if `onSubmit` throws.

### 2. `src/pages/Clients.tsx`

State: `clients: Client[]`, `loading: boolean`, `dialogOpen: boolean`, `saving: boolean`, `error: string | null`

Data fetching (in `useEffect`, re-run when component mounts):
```ts
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .order('name')
```

Layout:
- Page header: "Clients" h1, "New Client" Button (opens dialog) top-right
- If loading: simple "Loading..." text
- If no clients: empty state with "No clients yet" and a prompt to add one
- Otherwise: Table with columns — Name (link to /clients/:id), Phone, Email
- Dialog wraps ClientForm; on submit calls insert, then refreshes the list and closes dialog

Insert query:
```ts
const { error } = await supabase
  .from('clients')
  .insert({ ...formData, user_id: user!.id })
```

Get `user` from `useAuth()`.

### 3. `src/pages/ClientDetail.tsx`

URL param: `id` (from `useParams()`)

State: `client: Client | null`, `jobs: Job[]`, `loading: boolean`, `editDialogOpen: boolean`, `saving: boolean`

Fetch on mount (parallel):
```ts
const [clientResult, jobsResult] = await Promise.all([
  supabase.from('clients').select('*').eq('id', id).single(),
  supabase.from('jobs').select('*').eq('client_id', id).order('date', { ascending: false })
])
```

If client not found (error from `.single()`), show "Client not found" and a back link.

Layout:
- Back link to `/clients`
- Client name as h1, "Edit" Button opens dialog
- Info section: phone, email, address (only show fields that have values)
- "Jobs" section heading
- If no jobs: "No jobs yet" with a "New Job" link to `/jobs/new?client_id=${id}` (the JobNew page will pre-select this client)
- Jobs: Table with columns — Description (truncated, link to /jobs/:id), Date, Status badge

Status badge colors: `pending` → yellow/warning, `complete` → green

Edit: ClientForm pre-filled with current client data. On submit:
```ts
const { error } = await supabase
  .from('clients')
  .update(formData)
  .eq('id', id)
```
Then refresh client data and close dialog.

## Done when

- `/clients` shows a list of all clients ordered by name
- "New Client" opens a dialog; submitting adds the client and it appears in the list
- Clicking a client navigates to `/clients/:id`
- `/clients/:id` shows client info and their jobs
- "Edit" opens a pre-filled dialog; saving updates the client in place
