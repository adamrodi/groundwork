import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=DM+Mono:wght@400;500&display=swap');

        .gw-root {
          min-height: 100svh;
          background-color: #0b1509;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2.5rem 2rem;
          position: relative;
          overflow: hidden;
        }

        .gw-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse 90% 70% at 50% 55%, rgba(18, 65, 18, 0.5) 0%, transparent 65%);
          pointer-events: none;
        }

        .gw-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 340px;
          animation: gw-enter 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes gw-enter {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* — Eyebrow — */
        .gw-eyebrow {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.875rem;
        }

        .gw-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
          animation: gw-pulse 2.8s ease-in-out infinite;
        }

        @keyframes gw-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5); }
          50%       { opacity: 0.65; box-shadow: 0 0 0 5px rgba(74, 222, 128, 0); }
        }

        .gw-eyebrow-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.625rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #4ade80;
        }

        /* — Title — */
        .gw-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: clamp(4rem, 21vw, 6.25rem);
          line-height: 0.86;
          letter-spacing: -0.01em;
          color: #eef3eb;
          margin-bottom: 2.75rem;
          user-select: none;
        }

        /* — Divider — */
        .gw-rule {
          width: 100%;
          height: 1px;
          background: rgba(255, 255, 255, 0.07);
          margin-bottom: 2.25rem;
        }

        /* — Fields — */
        .gw-field {
          margin-bottom: 1.75rem;
        }

        .gw-label {
          display: block;
          font-family: 'DM Mono', monospace;
          font-size: 0.5625rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 0.6rem;
        }

        .gw-input {
          display: block;
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0;
          padding: 0.5rem 0;
          font-family: 'DM Mono', monospace;
          font-size: 0.9375rem;
          color: #eef3eb;
          outline: none;
          transition: border-color 0.18s ease;
          -webkit-appearance: none;
        }

        .gw-input:focus {
          border-bottom-color: #4ade80;
        }

        .gw-input::placeholder {
          color: rgba(255, 255, 255, 0.1);
        }

        .gw-input:-webkit-autofill,
        .gw-input:-webkit-autofill:hover,
        .gw-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #0b1509 inset;
          -webkit-text-fill-color: #eef3eb;
          caret-color: #eef3eb;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* — Error — */
        .gw-error {
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          color: #f87171;
          margin-top: -0.75rem;
          margin-bottom: 1.5rem;
          line-height: 1.5;
        }

        /* — Submit button — */
        .gw-btn {
          display: block;
          width: 100%;
          margin-top: 2.25rem;
          padding: 0.9375rem 1.5rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.8125rem;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #0b1509;
          background: #4ade80;
          border: none;
          border-radius: 0;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }

        .gw-btn:hover:not(:disabled) {
          background: #86efac;
        }

        .gw-btn:active:not(:disabled) {
          background: #22c55e;
        }

        .gw-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* — Footer — */
        .gw-footer {
          font-family: 'DM Mono', monospace;
          font-size: 0.5625rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.1);
          margin-top: 3rem;
        }
      `}</style>

      <div className="gw-root">
        <div className="gw-inner">

          <div className="gw-eyebrow">
            <span className="gw-dot" />
            <span className="gw-eyebrow-label">Field Operations</span>
          </div>

          <h1 className="gw-title">
            GROUND<br />WORK
          </h1>

          <div className="gw-rule" />

          <form onSubmit={handleSubmit}>
            <div className="gw-field">
              <label className="gw-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="gw-input"
              />
            </div>

            <div className="gw-field">
              <label className="gw-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="gw-input"
              />
            </div>

            {error && <p className="gw-error">{error}</p>}

            <button type="submit" disabled={submitting} className="gw-btn">
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="gw-footer">Groundwork · v1</p>

        </div>
      </div>
    </>
  )
}
