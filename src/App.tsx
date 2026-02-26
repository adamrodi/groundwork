import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import Dashboard from '@/pages/Dashboard'
import Clients from '@/pages/Clients'
import ClientDetail from '@/pages/ClientDetail'
import Jobs from '@/pages/Jobs'
import JobNew from '@/pages/JobNew'
import JobDetail from '@/pages/JobDetail'
import Invoices from '@/pages/Invoices'
import InvoiceDetail from '@/pages/InvoiceDetail'
import InvoicePublic from '@/pages/InvoicePublic'
import Login from '@/pages/Login'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/i/:id" element={<InvoicePublic />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Outlet />
                </AppLayout>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/new" element={<JobNew />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
