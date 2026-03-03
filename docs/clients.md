# Clients

## What it does

Salim can add clients (name, phone, email, address), view a searchable list, drill into details, see job history, and edit existing clients.

## Key files

- `src/pages/Clients.tsx` — List view, sorted by name. "New Client" opens a dialog.
- `src/pages/ClientDetail.tsx` — Detail view with edit dialog and job history. Fetches client + jobs in parallel via `Promise.all`.
- `src/components/ClientForm.tsx` — Reusable controlled form component. Accepts `initialData?` for create/edit reuse.
- `src/lib/types.ts` — All shared types (Client, Job, LineItem, Invoice) defined here.

## Architecture decisions

- **Dialog for create/edit** — Mobile PWA has limited space. Dialogs prevent full-page navigation friction.
- **ClientForm is a reusable pattern** — Parent owns state, passes `onSubmit`/`onCancel`. Same component for create and edit (with `initialData` prop).
- **Shared types in one file** — `src/lib/types.ts` prevents duplication. Schema changes are atomic.

## Gotchas

- Phone, email, address are nullable. UI only renders fields that have values.
- `/jobs/new?client_id=X` parameter pre-selects client in job creation (linked from ClientDetail).
- No uniqueness validation on client names — multiple clients can share names.
- RLS: All queries filter by `user_id = auth.uid()`.
