# Phase 1 — Auth

**Status:** complete
**Prerequisites:** none

## Goal

Salim logs in once on his phone and stays logged in. All protected routes redirect to `/login` when there is no session. No sign-up flow — Salim's account is created directly in the Supabase dashboard.

## Files

Created:

- `src/lib/auth.tsx` — AuthContext, AuthProvider, useAuth hook
- `src/components/ProtectedRoute.tsx` — route guard component

Modified:

- `src/pages/Login.tsx` — login form
- `src/App.tsx` — AuthProvider wrapping BrowserRouter, ProtectedRoute on all non-login routes

## No new dependencies

Uses existing: Button, Input, Label, Card from `src/components/ui/`.

## Architecture decisions

**AuthProvider wraps BrowserRouter.** Auth state is not router-dependent, so `AuthProvider` is the outermost wrapper in `App.tsx`. `ProtectedRoute` works fine because `<Navigate>` only requires being inside `<BrowserRouter>`, which it is.

**`useAuth` exposes `signOut`.** Context shape: `{ session, user, loading, signOut }`. Centralises the sign-out call so components import from `@/lib/auth` rather than `@supabase/supabase-js` directly. The `onAuthStateChange` listener handles the session update automatically.

**Loading returns `null`.** `getSession()` reads from localStorage — sub-frame latency on a PWA with a cached app shell. No spinner needed.

**No global nav in Phase 1.** Phase 2 (Clients) introduces `Layout.tsx` with a bottom nav bar using React Router nested routes + `<Outlet>`. Phase 1's flat `<ProtectedRoute>` per-route wrapping will be refactored then.

## Implementation

### `src/lib/auth.tsx`

Context shape: `{ session: Session | null, user: User | null, loading: boolean, signOut: () => Promise<void> }`.

Call `getSession()` first to hydrate from localStorage, then register `onAuthStateChange`. This is the required order — `onAuthStateChange` does not fire for the initial session on load.

### `src/components/ProtectedRoute.tsx`

- `loading` → return `null`
- no `session` → `<Navigate to="/login" replace />`
- otherwise → render children

### `src/pages/Login.tsx`

- Check auth at top of component: `if (loading) return null`, `if (session) return <Navigate to="/" replace />`
- State: `email`, `password`, `error: string | null`, `submitting: boolean`
- Call `supabase.auth.signInWithPassword({ email, password })`
- On error: set `error` to `error.message`, clear `submitting`
- On success: `navigate('/')`
- Layout: centered Card on `bg-green-50`, title "Groundwork", subtitle "Sign in to continue"

### `src/App.tsx`

```tsx
<AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* repeat for all protected routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

## Done when

- Navigating to `/` without a session redirects to `/login`
- Submitting the login form with correct credentials lands on Dashboard
- Submitting with wrong credentials shows an error message
- Refreshing the page while logged in does not log you out (session persists via Supabase's localStorage mechanism)
- Navigating to `/login` while already logged in redirects to `/`
