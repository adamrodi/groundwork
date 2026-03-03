# Auth

## What it does

Salim logs in with email/password and stays logged in. All protected routes redirect to `/login` when no session exists. No sign-up flow — Salim's account is created in the Supabase dashboard.

## Key files

- `src/lib/auth.tsx` — AuthContext/AuthProvider/useAuth hook. Exposes `{ session, user, loading, signOut }`.
- `src/components/ProtectedRoute.tsx` — Route guard. Loading → `null`, no session → redirect to `/login`.
- `src/pages/Login.tsx` — Email/password form. Already-logged-in users redirect to `/`.

## Architecture decisions

- **AuthProvider wraps BrowserRouter** — Auth state is router-independent. `<Navigate>` only needs to be inside `<BrowserRouter>`, which it is.
- **`useAuth` centralizes auth** — Components import from `@/lib/auth`, never from `@supabase/supabase-js` directly. Makes auth mockable in tests.
- **Loading returns `null`** — `getSession()` reads from localStorage (sub-frame latency on a PWA). No spinner needed.
- **Session hydration order matters** — Must call `getSession()` first, then register `onAuthStateChange`. The listener doesn't fire for the initial session on load.

## Gotchas

- Session persistence is entirely Supabase-managed (localStorage). No custom session management.
- The flat per-route `<ProtectedRoute>` wrappers were later refactored into layout-based nesting via `<AppLayout>` + `<Outlet>`.
