import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Client, Job } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import ClientForm from '@/components/ClientForm'
import { cn } from '@/lib/utils'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchData() {
    const [clientResult, jobsResult] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('jobs').select('*').eq('client_id', id).order('date', { ascending: false }),
    ])
    if (clientResult.error || !clientResult.data) {
      setNotFound(true)
    } else {
      setClient(clientResult.data as Client)
      setJobs((jobsResult.data as Job[]) ?? [])
    }
  }

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [id])

  async function handleEdit(formData: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    setSaving(true)
    try {
      const { error } = await supabase.from('clients').update(formData).eq('id', id)
      if (error) throw error
      setLoading(true)
      await fetchData()
      setEditOpen(false)
    } finally {
      setSaving(false)
      setLoading(false)
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Loading…</p>

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="mb-4 text-muted-foreground">Client not found.</p>
        <Link to="/clients" className="text-sm underline">
          Back to Clients
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link to="/clients" className="mb-6 block text-sm text-muted-foreground hover:underline">
        ← Back
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-2xl font-semibold">{client!.name}</h1>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit
        </Button>
      </div>

      <div className="mb-8 space-y-1 text-sm text-muted-foreground">
        {client!.phone && <p>{client!.phone}</p>}
        {client!.email && <p>{client!.email}</p>}
        {client!.address && <p>{client!.address}</p>}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No jobs yet.{' '}
            <Link to={`/jobs/new?client_id=${id}`} className="underline">
              New Job
            </Link>
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link to={`/jobs/${job.id}`} className="hover:underline">
                      {job.description
                        ? job.description.length > 40
                          ? job.description.slice(0, 40) + '…'
                          : job.description
                        : '—'}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.date ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        job.status === 'complete' && 'bg-green-600 text-white hover:bg-green-700',
                        job.status === 'pending' && 'bg-yellow-500 text-white hover:bg-yellow-600'
                      )}
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            initialData={client ?? undefined}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
