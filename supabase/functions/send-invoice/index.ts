import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"
import { Resend } from "npm:resend"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { invoiceId } = await req.json()

  if (!invoiceId) {
    return new Response(JSON.stringify({ error: 'invoiceId is required' }), { status: 400, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('id', invoiceId)
    .single()

  if (invoiceError || !invoice) {
    return new Response(JSON.stringify({ error: 'Invoice not found' }), { status: 404, headers: corsHeaders })
  }

  if (!invoice.clients?.email) {
    return new Response(JSON.stringify({ error: 'Client has no email address' }), { status: 400, headers: corsHeaders })
  }

  const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
  const appUrl = Deno.env.get('APP_URL') ?? 'https://groundwork.vercel.app'

  const { error: emailError } = await resend.emails.send({
    from: 'Groundwork <onboarding@resend.dev>',
    to: invoice.clients.email,
    subject: `Invoice #${invoice.invoice_number} from Groundwork`,
    html: `
      <p>Hi ${invoice.clients.name},</p>
      <p>Please find your invoice here: <a href="${appUrl}/i/${invoiceId}">${appUrl}/i/${invoiceId}</a></p>
      <p>Total: $${(invoice.total / 100).toFixed(2)}</p>
      <p>Thank you for your business.</p>
    `
  })

  if (emailError) {
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders })
  }

  await supabase
    .from('invoices')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', invoiceId)

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
