import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Invoice, Client, LineItem } from '@/lib/types'
import { formatCents } from '@/lib/utils'

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  businessName: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  invoiceNumber: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  clientName: {
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: '6 8',
    fontSize: 9,
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 8',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDescription: { flex: 3 },
  colQty: { width: 40, textAlign: 'right' },
  colUnitPrice: { width: 72, textAlign: 'right' },
  colTotal: { width: 72, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    marginRight: 8,
  },
  totalValue: {
    width: 72,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
    textAlign: 'center',
    fontSize: 10,
    color: '#9ca3af',
  },
})


type InvoicePDFProps = {
  invoice: Invoice
  client: Client
  lineItems: LineItem[]
  businessName?: string
}

export function InvoicePDF({ invoice, client, lineItems, businessName = 'Groundwork' }: InvoicePDFProps) {
  const total = lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.businessName}>{businessName}</Text>
        <View style={styles.rule} />

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Invoice</Text>
            <Text style={styles.invoiceNumber}>#{invoice.invoice_number}</Text>
          </View>
          <View>
            <Text style={styles.label}>Date</Text>
            <Text>{new Date(invoice.created_at).toLocaleDateString('en-US')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.phone && <Text>{client.phone}</Text>}
          {client.email && <Text>{client.email}</Text>}
          {client.address && <Text>{client.address}</Text>}
        </View>

        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnitPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {lineItems.map(item => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnitPrice}>{formatCents(item.unit_price)}</Text>
              <Text style={styles.colTotal}>{formatCents(item.quantity * item.unit_price)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.rule} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCents(total)}</Text>
        </View>

        <Text style={styles.footer}>Thank you for your business</Text>
      </Page>
    </Document>
  )
}

export async function downloadInvoicePDF(invoice: Invoice, client: Client, lineItems: LineItem[]) {
  const blob = await pdf(<InvoicePDF invoice={invoice} client={client} lineItems={lineItems} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${invoice.invoice_number}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
