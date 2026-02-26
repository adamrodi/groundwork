import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth'
import { ColorModeProvider } from '@/lib/colorMode'
import ProtectedRoute from '@/components/ProtectedRoute'
import ColorModeToggle from '@/components/ColorModeToggle'
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
    <ColorModeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ColorModeToggle />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
            <Route path="/clients/:id" element={<ProtectedRoute><ClientDetail /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/new" element={<ProtectedRoute><JobNew /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/i/:id" element={<InvoicePublic />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ColorModeProvider>
  )
}

export default App
