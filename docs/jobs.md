# Jobs

## What it does

Salim creates jobs with line items (description, quantity, unit price), marks them complete, and creates draft invoices from completed jobs.

## Key files

- `src/pages/Jobs.tsx` — List view with status badges.
- `src/pages/JobNew.tsx` — Create form with client dropdown and dynamic line items editor.
- `src/pages/JobDetail.tsx` — Detail view. "Mark Complete" and "Create Invoice" buttons based on status.
- `src/components/LineItemsEditor.tsx` — Controlled component for adding/removing line items. Parent owns state via `onChange`.

## Architecture decisions

- **`LineItemDraft` uses strings for inputs** — HTML inputs return strings. Conversion to cents (`Math.round(dollars * 100)`) happens only at submit time.
- **Invoice auto-creation checks for existing** — "Create Invoice" queries for an existing invoice on the job first. If found, navigates to it. If not, inserts a new draft invoice with calculated total.
- **Money stored in cents** — All `unit_price` and `total` fields are integers (cents). `formatCents()` in `src/lib/utils.ts` handles display.

## Gotchas

- At least one line item with description and price is required for submission.
- Invoice creation from a job can only happen once (unless the invoice is manually deleted).
- New invoices start as `draft` — they're not sent until Salim takes action in InvoiceDetail.
- `?client_id=` query param pre-selects the client dropdown (linked from ClientDetail).
- Job `date` field is DATE type (not timestamp). Format as ISO `YYYY-MM-DD`.
