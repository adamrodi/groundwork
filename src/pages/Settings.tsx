import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { CheckCircle } from 'lucide-react'
import type { Profile } from '@/lib/types'

export default function Settings() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stripeParam = searchParams.get('stripe')

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      // PGRST116 = no row yet — profile just doesn't exist yet, not an error
      if (error && error.code !== 'PGRST116') {
        setError('Failed to load settings.')
      } else {
        setProfile(data as Profile ?? null)
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  // AccountLink expired — auto-retrigger a fresh one
  useEffect(() => {
    if (stripeParam === 'refresh' && user && !connecting) handleConnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stripeParam, user])

  async function handleConnect() {
    setConnecting(true)
    const { data, error } = await supabase.functions.invoke('stripe-connect-onboard')
    if (error || !data?.url) {
      setError('Could not start payment setup. Please try again.')
      setConnecting(false)
      return
    }
    window.location.href = data.url
  }

  if (loading) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {stripeParam === 'connected' && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium">
          Payment account connected successfully.
        </div>
      )}

      <div className="rounded-lg border p-6 space-y-4">
        <h2 className="text-sm font-medium">Card payments</h2>
        {profile?.stripe_account_id ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle size={16} />
            <span>Payment account connected</span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your payment account to accept card payments on invoices.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className={cn(
                'rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white',
                connecting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-green-700'
              )}
            >
              {connecting ? 'Redirecting…' : 'Connect payment account'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
