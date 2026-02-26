# Phase 6 — Dashboard

**Status:** not started
**Prerequisites:** All other phases complete (needs real data to be useful)

## Goal

The Dashboard gives Salim an at-a-glance view when he opens the app: how much money is outstanding, which invoices need following up, and what jobs he did recently. It's the home screen — it should load fast and show what matters most.

## Files

Modify:
- `src/pages/Dashboard.tsx`

No new components or dependencies needed. Uses existing Card, Badge, and Table components.

## Data to fetch

All queries run in parallel on mount. Use `Promise.all`.

**1. Outstanding invoices (status = 'sent')**
```ts
const { data: outstandingInvoices } = await supabase
  .from('invoices')
  .select('*, clients(name)')
  .eq('status', 'sent')
  .order('created_at', { ascending: true })  // oldest first — most overdue at top
```

**2. Summary totals**
```ts
// Total outstanding (sum of sent invoices)
// Total paid this month
const { data: paidThisMonth } = await supabase
  .from('invoices')
  .select('total')
  .eq('status', 'paid')
  .gte('paid_at', startOfMonth)  // startOfMonth = new Date(year, month, 1).toISOString()
```

**3. Recent jobs (last 5)**
```ts
const { data: recentJobs } = await supabase
  .from('jobs')
  .select('*, clients(name)')
  .order('date', { ascending: false })
  .limit(5)
```

## Layout

Three sections stacked vertically (mobile-first):

### Section 1 — Summary cards (side by side, 2 columns)

**Outstanding** card:
- Label: "Outstanding"
- Value: `formatCents(sum of outstandingInvoices.total)` — sum all totals in the array client-side
- Subtext: `${outstandingInvoices.length} invoice${plural}`
- If nothing outstanding: show $0 with "All paid up" subtext in green

**Paid this month** card:
- Label: "Paid this month"
- Value: `formatCents(sum of paidThisMonth.total)`
- Subtext: current month name + year (e.g. "February 2026")

Use the Card component for these. No link — purely informational.

### Section 2 — Outstanding invoices

Heading: "Needs payment" (only show this section if there are outstanding invoices)

List (not a full table on mobile — use cards or a simple list):
Each item shows:
- Client name
- Invoice number (#42)
- Total
- Days since sent: `Math.floor((now - new Date(sent_at)) / 86400000)` days — e.g. "Sent 3 days ago"
- Tap navigates to `/invoices/:id`

If no outstanding invoices: hide this section entirely (not an empty state — just don't render it).

### Section 3 — Recent jobs

Heading: "Recent jobs"

List of the last 5 jobs:
- Client name
- Description (truncated)
- Date
- Status badge

Each item links to `/jobs/:id`.

"View all jobs" link to `/jobs` at the bottom.

## Navigation

The Dashboard is the home screen. It needs a way to navigate to other sections. Add a shared navigation component.

### App layout with bottom nav

Since this is a mobile PWA, use a bottom navigation bar. Create `src/components/AppLayout.tsx`:

```tsx
// Wraps all protected pages (not Login, not InvoicePublic)
// Renders children above a fixed bottom nav bar
// Nav items: Dashboard (/), Clients (/clients), Jobs (/jobs), Invoices (/invoices)
// Use lucide-react icons: LayoutDashboard, Users, Briefcase, FileText
// Active state: use useLocation() to match current path
```

Update `App.tsx` to wrap protected routes in `<AppLayout>` (inside `<ProtectedRoute>`).

The bottom nav height is ~56px. Add `pb-14` (or `pb-16`) to page containers so content isn't obscured.

## Done when

- Dashboard loads and shows correct outstanding total and paid-this-month total
- Outstanding invoices list links to the correct invoice detail pages
- Recent jobs list links to the correct job detail pages
- Bottom navigation works on all protected pages
- Tapping each nav item navigates to the correct route with active state highlighted
