export type Client = {
  id: string
  user_id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  created_at: string
}

export type Job = {
  id: string
  user_id: string
  client_id: string
  description: string | null
  date: string | null
  status: 'pending' | 'complete'
  created_at: string
}

export type LineItem = {
  id: string
  job_id: string
  description: string
  quantity: number
  unit_price: number // cents
}

export type Invoice = {
  id: string
  user_id: string
  job_id: string | null
  client_id: string
  invoice_number: number
  status: 'draft' | 'sent' | 'paid'
  total: number // cents
  sent_at: string | null
  paid_at: string | null
  created_at: string
}
