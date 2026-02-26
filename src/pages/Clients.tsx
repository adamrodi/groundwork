import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import type { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*').order('name')
    setClients((data as Client[]) ?? [])
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button onClick={() => setDialogOpen(true)}>New Client</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
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
