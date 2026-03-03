# Payments

## What it does

Clients pay invoices by card from the public invoice page via Stripe. Salim onboards his Stripe Connect account from Settings. Invoices auto-mark as paid via webhook.

## Key files

- `supabase/functions/create-payment-intent/index.ts` — Creates a PaymentIntent on the connected account. Called by the public invoice page.
- `supabase/functions/stripe-webhook/index.ts` — Handles `payment_intent.succeeded`. Verifies signature, checks idempotency and amount, marks invoice paid.
- `supabase/functions/stripe-connect-onboard/index.ts` — Creates Stripe Connect account + AccountLink for onboarding. Called from Settings (JWT auth).
- `src/pages/InvoicePublic.tsx` — Renders Stripe Payment Element after "Pay with Card" click.
- `src/pages/Settings.tsx` — Stripe Connect onboarding UI.

## Architecture decisions

- **Stripe Connect with direct charges** — Salim's connected account is merchant of record. Simplest model for single-user (no splits).
- **Three separate Edge Functions** — Each has distinct auth: `create-payment-intent` (anon key), `stripe-webhook` (`--no-verify-jwt`, signature verification), `stripe-connect-onboard` (JWT auth).
- **Webhook uses `constructEventAsync`** — Deno's SubtleCrypto is async-only. `constructEvent` (synchronous) doesn't work.
- **`stripe_account_id` in profiles table** — Links Supabase user to Stripe connected account. One account per user.

## Flows

**Onboarding:** Settings → "Connect payment account" → Edge Function creates Connect account + AccountLink → redirect to Stripe hosted onboarding → return to `/settings?stripe=connected`.

**Payment:** Client opens `/i/:id` → "Pay with Card" → `create-payment-intent` Edge Function → Stripe Payment Element renders → client pays → webhook fires → invoice marked `paid`.

**3DS cards:** Client redirected to bank mid-payment, returns to `/i/:id?paid=1`. Webhook is the source of truth (the `?paid=1` param is just a UX hint).

## Deploy

```bash
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy stripe-connect-onboard
```

Requires secrets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`.
Client env: `VITE_STRIPE_PUBLISHABLE_KEY`.
Stripe dashboard: register webhook URL `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`, subscribe to `payment_intent.succeeded`.

## Gotchas

- `stripe-webhook` MUST deploy with `--no-verify-jwt` — Stripe can't provide a Supabase JWT. Signature verification replaces JWT auth.
- Webhook idempotency: checks `WHERE id = ? AND status != 'paid'` before updating. Duplicate events are harmless.
- PaymentIntent amount must exactly match invoice total (in cents). Webhook validates this.
- `create-payment-intent` only allows invoices in `sent` status.
- `stripe-connect-onboard` authenticates via JWT in Authorization header (sent by Supabase SDK). Does NOT read userId from request body.
- If Stripe onboarding link expires, Stripe redirects to `/settings?stripe=refresh` which auto-triggers a fresh onboarding link.
