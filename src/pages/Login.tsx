import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function Login() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [signupDone, setSignupDone] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setSignupDone(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSignupDone(true)
      }
      setSubmitting(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[340px]">

        {/* Wordmark block */}
        <div className="mb-10">
          <h1 className="font-display font-black text-foreground leading-none select-none" style={{ fontSize: '3.25rem' }}>
            GROUNDWORK
          </h1>
          <p className="font-mono text-xs text-muted-foreground mt-2.5">
            Landscaping business tools
          </p>
        </div>

        {/* Separator */}
        <div className="border-t border-border mb-8" />

        {signupDone ? (
          <div>
            <p className="font-mono text-sm text-foreground/70 leading-relaxed mb-5">
              Check your email for a confirmation link, then come back and sign in.
            </p>
            <button
              onClick={() => switchMode('signin')}
              className="font-mono text-xs text-primary hover:opacity-70 transition-opacity"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>

            <div className="mb-5">
              <label
                htmlFor="email"
                className="font-mono text-xs font-medium text-muted-foreground block mb-2"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 font-mono text-sm"
              />
            </div>

            <div className="mb-7">
              <label
                htmlFor="password"
                className="font-mono text-xs font-medium text-muted-foreground block mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 font-mono text-sm"
              />
            </div>

            {error && (
              <p className={cn(
                'font-mono text-xs text-destructive mb-5',
                '-mt-2'
              )}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              size="lg"
              className="w-full font-mono text-sm"
            >
              {submitting
                ? mode === 'signup' ? 'Creating account…' : 'Signing in…'
                : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Button>

          </form>
        )}

        {/* Mode toggle */}
        {!signupDone && (
          <p className="font-mono text-xs text-muted-foreground mt-5">
            {mode === 'signin' ? (
              <>
                No account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-primary hover:opacity-70 transition-opacity"
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-primary hover:opacity-70 transition-opacity"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        )}

      </div>
    </div>
  )
}
