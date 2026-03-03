# Dashboard & App Layout

## What it does

Dashboard is Salim's home screen showing outstanding balance, paid-this-month total, unpaid invoices, and recent jobs. AppLayout provides shared bottom navigation across all protected routes.

## Key files

- `src/pages/Dashboard.tsx` — Three parallel queries on mount: outstanding invoices, paid-this-month, recent jobs (limit 5).
- `src/components/AppLayout.tsx` — Bottom nav bar with `<Outlet>` for nested routes. Icons: LayoutDashboard, Users, Briefcase, FileText.

## Architecture decisions

- **AppLayout wraps all protected routes** — Refactored from the original flat per-route `<ProtectedRoute>` wrappers to layout-based nesting with `<Outlet>`.
- **Parallel queries** — `Promise.all` minimizes load time. Three Supabase calls fire simultaneously.
- **Summary cards, not charts** — MVP prioritizes information density. Four stat tiles convey essential context.
- **Active nav state via `useLocation()`** — Compares `pathname` to highlight current section.

## Gotchas

- "Needs payment" section is entirely hidden (not empty state) when no outstanding invoices exist.
- "Paid this month" uses calendar month boundaries (`new Date(year, month, 1)`).
- Recent jobs hardcoded to 5 results. "View all jobs" link is the overflow path.
- Bottom nav height is ~56px. Pages need `pb-14` or `pb-16` so content isn't hidden under it.
- Nested routes: `/clients/:id` should highlight the "Clients" nav item. Path matching uses `startsWith`.
- Dashboard doesn't auto-refresh. Payment state changes in other tabs require a page refresh.
