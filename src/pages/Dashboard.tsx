import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCents } from '@/lib/utils'
import type { Invoice, Job } from '@/lib/types'

type OutstandingInvoice = Invoice & { clients: { name: string } }
type RecentJob = Job & { clients: { name: string } | null }

export default function Dashboard() {
  const [outstanding, setOutstanding] = useState<OutstandingInvoice[]>([])
  const [paidTotal, setPaidTotal] = useState(0)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const [outstandingResult, paidResult, recentJobsResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, clients(name)')
          .eq('status', 'sent')
          .order('created_at', { ascending: true }),
        supabase
          .from('invoices')
          .select('total')
          .eq('status', 'paid')
          .gte('paid_at', startOfMonth),
        supabase
          .from('jobs')
          .select('*, clients(name)')
          .order('date', { ascending: false })
          .limit(5),
      ])

      if (outstandingResult.error || paidResult.error || recentJobsResult.error) {
        setFetchError('Failed to load dashboard data.')
      } else {
        setOutstanding((outstandingResult.data as OutstandingInvoice[]) ?? [])
        const paid = (paidResult.data ?? []) as { total: number }[]
        setPaidTotal(paid.reduce((sum, inv) => sum + inv.total, 0))
        setRecentJobs((recentJobsResult.data as RecentJob[]) ?? [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return null

  if (fetchError) {
    return (
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-destructive">{fetchError}</p>
      </div>
    )
  }

  const totalOutstanding = outstanding.reduce((sum, inv) => sum + inv.total, 0)
  const monthLabel = new Date().toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })

  function daysSinceSent(sentAt: string) {
    return Math.floor((Date.now() - new Date(sentAt).getTime()) / 86400000)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-8">

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Outstanding</CardDescription>
            <CardTitle className="text-2xl">{formatCents(totalOutstanding)}</CardTitle>
          </CardHeader>
          <CardContent>
            {outstanding.length === 0
              ? <p className="text-xs text-green-600">All paid up</p>
              : <p className="text-xs text-muted-foreground">{outstanding.length} invoice{outstanding.length !== 1 ? 's' : ''}</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Paid this month</CardDescription>
            <CardTitle className="text-2xl">{formatCents(paidTotal)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">{monthLabel}</p>
          </CardContent>
        </Card>
      </div>

      {/* Needs payment (only if there are outstanding invoices) */}
      {outstanding.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Needs payment</h2>
          <div className="space-y-2">
            {outstanding.map(inv => {
              const days = inv.sent_at ? daysSinceSent(inv.sent_at) : null
              return (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{inv.clients.name}</p>
                    <p className="text-xs text-muted-foreground">
                      #{inv.invoice_number} · {days !== null ? `Sent ${days} day${days !== 1 ? 's' : ''} ago` : 'Sent recently'}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatCents(inv.total)}</p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent jobs */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Recent jobs</h2>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {recentJobs.map(job => {
              const desc = job.description
              const truncated = desc ? (desc.length > 40 ? desc.slice(0, 40) + '…' : desc) : '—'
              return (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between rounded-md border border-border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{job.clients?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{truncated}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs text-muted-foreground">{job.date ?? '—'}</p>
                    <Badge className={cn(job.status === 'complete' && 'bg-green-600 text-white hover:bg-green-700')}>
                      {job.status}
                    </Badge>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
        <Link to="/jobs" className="text-xs text-muted-foreground hover:underline">View all jobs →</Link>
      </div>

    </div>
  )
}
