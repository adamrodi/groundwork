import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Job } from '@/lib/types'

type JobWithClient = Job & { clients: { name: string } | null }

export default function Jobs() {
  const [jobs, setJobs] = useState<JobWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchJobs() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, clients(name)')
        .order('date', { ascending: false })
      if (error) {
        setFetchError('Failed to load jobs.')
      } else {
        setJobs((data as JobWithClient[]) ?? [])
      }
      setLoading(false)
    }
    fetchJobs()
  }, [])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Jobs</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : fetchError ? (
        <p className="text-destructive">{fetchError}</p>
      ) : jobs.length === 0 ? (
        <p className="text-muted-foreground">No jobs yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map(job => {
              const desc = job.description
              const truncated = desc
                ? desc.length > 40
                  ? desc.slice(0, 40) + '…'
                  : desc
                : '—'
              return (
                <TableRow key={job.id}>
                  <TableCell>{job.clients?.name ?? '—'}</TableCell>
                  <TableCell>
                    <Link to={`/jobs/${job.id}`}>{truncated}</Link>
                  </TableCell>
                  <TableCell>{job.date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        job.status === 'complete' && 'bg-green-600 text-white hover:bg-green-700'
                      )}
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <Link
        to="/jobs/new"
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors"
        aria-label="New job"
      >
        <Plus size={24} />
      </Link>
    </div>
  )
}
