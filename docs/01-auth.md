# Phase 1 — Auth

**Status:** not started
**Prerequisites:** none

## Goal

Salim logs in once on his phone and stays logged in. All protected routes redirect to `/login` when there is no session. No sign-up flow — Salim's account is created directly in the Supabase dashboard.

## Files

Create:
- `src/lib/auth.tsx` — AuthContext, AuthProvider, useAuth hook
- `src/components/ProtectedRoute.tsx` — route guard component

Modify:
- `src/pages/Login.tsx` — implement the login form
- `src/App.tsx` — wrap app in AuthProvider, guard all routes except /login

## No new dependencies

No new packages or shadcn components needed. Uses existing Button, Input, Label.

## Implementation

### 1. `src/lib/auth.tsx`

Create a context with shape `{ session: Session | null, user: User | null, loading: boolean }`.

```tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### 2. `src/components/ProtectedRoute.tsx`

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) return null

  if (!session) return <Navigate to="/login" replace />

  return <>{children}</>
}
```

### 3. `src/pages/Login.tsx`

- Email + password form, no sign-up link
- Call `supabase.auth.signInWithPassword({ email, password })`
- On success: `navigate('/')`
- On error: display the error message from Supabase
- Show a loading state on the button while the request is in flight
- Redirect to `/` if already authenticated (check `session` from `useAuth()`)

State: `email`, `password`, `error: string | null`, `loading: boolean`

Layout: centered card on a green-tinted background. Use the Card component. Title "Groundwork". Subtitle "Sign in to continue".

### 4. `src/App.tsx`

Wrap the entire router output in `<AuthProvider>`. Wrap each protected route's element in `<ProtectedRoute>`:

```tsx
import { AuthProvider } from '@/lib/auth'
import ProtectedRoute from '@/components/ProtectedRoute'

// /login stays unwrapped
// All others:
<Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
// repeat for all protected routes
```

## Done when

- Navigating to `/` without a session redirects to `/login`
- Submitting the login form with correct credentials lands on Dashboard
- Submitting with wrong credentials shows an error message
- Refreshing the page while logged in does not log you out (session persists via Supabase's localStorage mechanism)
- Navigating to `/login` while already logged in redirects to `/`
