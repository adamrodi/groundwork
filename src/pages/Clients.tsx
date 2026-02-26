import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Client } from '@/lib/types'
import { Plus } from 'lucide-react'
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

export default function Clients() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchClients() {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) {
      setFetchError('Failed to load clients.')
    } else {
      setClients((data as Client[]) ?? [])
    }
  }

  useEffect(() => {
    fetchClients().finally(() => setLoading(false))
  }, [])

  async function handleCreate(formData: Omit<Client, 'id' | 'user_id' | 'created_at'>) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('clients')
        .insert({ ...formData, user_id: user!.id })
      if (error) throw error
      await fetchClients()
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-6">Clients</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : fetchError ? (
        <p className="text-destructive">{fetchError}</p>
      ) : clients.length === 0 ? (
        <p className="text-muted-foreground">
          No clients yet.{' '}
          <button
            className="underline"
            onClick={() => setDialogOpen(true)}
          >
            Add your first client.
          </button>
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link
                    to={`/clients/${c.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <button
        onClick={() => setDialogOpen(true)}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition-colors"
        aria-label="New client"
      >
        <Plus size={24} />
      </button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>New Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={handleCreate}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
