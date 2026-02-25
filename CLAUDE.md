# Groundwork

## What this is

Salim runs a landscaping business and pays $40/month for Jobber. Groundwork is a replacement PWA built to get him off Jobber. The immediate MVP goal is invoicing. Long-term this becomes a SaaS product for other landscaping/trades businesses. Salim is the only user for now and gives ongoing feedback.

## Stack

| Layer | Tool |
|---|---|
| Build tool | Vite |
| Framework | React + TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Router | React Router v6 |
| Backend / DB | Supabase (JS SDK, no custom backend for MVP) |
| Auth | Supabase Auth (email + password) |
| PDF generation | @react-pdf/renderer (client-side) |
| Email | Resend (free tier) |
| PWA | vite-plugin-pwa |
| Hosting | Vercel (free tier) |
| Backend (later) | Python FastAPI (Stripe webhooks, AI/transcription) |

**Important Tailwind note:** Tailwind v4 is configured via `@tailwindcss/vite` in `vite.config.ts`. There is no `tailwind.config.js` — that's intentional for v4.

## Current status

Setup is complete. The app builds and runs. All routes exist as placeholder pages — nothing functional is built yet.

## What exists

- Routing wired in [src/App.tsx](src/App.tsx) — all routes present
- Supabase client at [src/lib/supabase.ts](src/lib/supabase.ts) — reads from `.env.local`
- shadcn/ui components in [src/components/ui/](src/components/ui/) — button, input, label, card, table, badge, separator
- PWA manifest configured with green theme (`#16a34a`)
- Database tables created in Supabase with RLS enabled

## Database schema

All tables are in Supabase (Postgres). RLS is enabled on all of them.

- `clients` — id, user_id, name, email, phone, address, created_at
- `jobs` — id, user_id, client_id, description, date, status (`pending`|`complete`), created_at
- `line_items` — id, job_id, description, quantity, unit_price
- `invoices` — id, user_id, job_id, client_id, invoice_number (serial), status (`draft`|`sent`|`paid`), total, sent_at, paid_at, created_at

## Pages

All are placeholder stubs that just render a heading.

| Route | File |
|---|---|
| `/` | [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx) |
| `/login` | [src/pages/Login.tsx](src/pages/Login.tsx) |
| `/clients` | [src/pages/Clients.tsx](src/pages/Clients.tsx) |
| `/clients/:id` | [src/pages/ClientDetail.tsx](src/pages/ClientDetail.tsx) |
| `/jobs` | [src/pages/Jobs.tsx](src/pages/Jobs.tsx) |
| `/jobs/new` | [src/pages/JobNew.tsx](src/pages/JobNew.tsx) |
| `/jobs/:id` | [src/pages/JobDetail.tsx](src/pages/JobDetail.tsx) |
| `/invoices` | [src/pages/Invoices.tsx](src/pages/Invoices.tsx) |
| `/invoices/:id` | [src/pages/InvoiceDetail.tsx](src/pages/InvoiceDetail.tsx) |

## MVP build order

1. **Auth** — Login page, session guard on all routes
2. **Clients** — list, create, view
3. **Jobs** — create a job for a client, add line items
4. **Invoices** — generate from a job, view as PDF, send via email link
5. **Dashboard** — open invoices and recent jobs summary

## Important notes

- `.env.local` holds Supabase credentials — never commit it (covered by `*.local` in .gitignore)
- Path alias `@/` maps to `src/` — configured in `tsconfig.app.json`, `tsconfig.json`, and `vite.config.ts`
- shadcn/ui components in `src/components/ui/` are owned code — edit them directly when needed
- The developer is a CS student learning Tailwind for the first time — prefer clear Tailwind usage over clever one-liners

## Future (post-MVP)

- Python FastAPI backend for Stripe payment webhooks
- AI job notes / transcription via Whisper API
- Multi-tenant (other landscaping businesses as paying customers)
- Push notifications
- Native iOS app (Swift/SwiftUI rebuild once product is proven)
