import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Login() {
  const { session, loading } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Crosshair + coordinates are field-survey decorations — hide on themes where they clash
  const showDecorations = !['brutalist', 'carbon-night', 'veilance'].includes(theme)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-svh flex items-center justify-center px-8 py-16 relative overflow-hidden">

      {/* Radial glow — color follows theme via .gw-radial-glow CSS class */}
      <div className="fixed inset-0 pointer-events-none gw-radial-glow" />

      {/* Top-left crosshair — only on field-survey themes */}
      {showDecorations && (
        <div
          className="fixed top-6 left-6 pointer-events-none"
          style={{ animation: 'gw-enter 1s cubic-bezier(0.16,1,0.3,1) 0.75s both' }}
          aria-hidden="true"
        >
          <div className="relative size-5 opacity-[0.22]">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary -translate-y-px" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary -translate-x-px" />
            <div className="absolute inset-[3px] rounded-full border border-primary" />
          </div>
        </div>
      )}

      {/* Bottom-right field coordinates — only on field-survey themes */}
      {showDecorations && (
        <div
          className="fixed bottom-6 right-6 text-right pointer-events-none"
          style={{ animation: 'gw-enter 1s cubic-bezier(0.16,1,0.3,1) 0.9s both' }}
          aria-hidden="true"
        >
          <p className="text-[0.4375rem] tracking-[0.18em] uppercase text-muted-foreground/20 leading-loose">
            43.6532° N<br />79.3832° W
          </p>
        </div>
      )}

      <div className="relative z-10 w-full max-w-[340px]">

        {/* Eyebrow */}
        <div
          className="flex items-center gap-2 mb-3.5"
          style={{ animation: 'gw-enter 0.55s cubic-bezier(0.16,1,0.3,1) 0.05s both' }}
        >
          <span className="size-1.5 rounded-full bg-primary shrink-0 [animation:pulse-glow_2.8s_ease-in-out_infinite]" />
          <span className="text-[0.5625rem] tracking-[0.22em] uppercase text-primary">
            Field Ops · Auth
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-display font-black leading-[0.86] tracking-[-0.01em] text-foreground mb-11 select-none"
          style={{
            fontSize: 'clamp(4rem, 21vw, 6.25rem)',
            animation: 'gw-enter 0.65s cubic-bezier(0.16,1,0.3,1) 0.12s both',
          }}
        >
          GROUND<br />WORK
        </h1>

        {/* Divider — draws in from left */}
        <div
          className="w-full h-px bg-border mb-9 origin-left"
          style={{ animation: 'gw-grow-x 0.9s cubic-bezier(0.16,1,0.3,1) 0.3s both' }}
        />

        <form
          onSubmit={handleSubmit}
          style={{ animation: 'gw-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.48s both' }}
        >
          <div className="mb-7">
            <Label
              htmlFor="email"
              className="text-[0.5625rem] tracking-[0.22em] uppercase text-muted-foreground mb-2.5 flex items-center gap-2.5"
            >
              <span className="text-primary/40">01</span>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-0 border-b rounded-none px-0 h-auto py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-foreground/10 transition-colors duration-300"
            />
          </div>

          <div className="mb-7">
            <Label
              htmlFor="password"
              className="text-[0.5625rem] tracking-[0.22em] uppercase text-muted-foreground mb-2.5 flex items-center gap-2.5"
            >
              <span className="text-primary/40">02</span>
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-0 border-b rounded-none px-0 h-auto py-2 shadow-none focus-visible:ring-0 focus-visible:border-primary placeholder:text-foreground/10 transition-colors duration-300"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive mb-6 flex items-center gap-2">
              <span className="shrink-0 text-destructive/60">!</span>
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full mt-9 h-12 rounded-none text-xs tracking-[0.16em] uppercase"
          >
            {submitting ? 'Authenticating…' : 'Sign In →'}
          </Button>
        </form>

        <p
          className="text-[0.5625rem] tracking-[0.16em] uppercase text-muted-foreground/20 mt-12"
          style={{ animation: 'gw-enter 0.6s cubic-bezier(0.16,1,0.3,1) 0.72s both' }}
        >
          Groundwork · v1
        </p>

      </div>
    </div>
  )
}
