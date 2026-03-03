import { useLocation, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Briefcase, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/',         icon: LayoutDashboard },
  { label: 'Clients',   path: '/clients',  icon: Users },
  { label: 'Jobs',      path: '/jobs',     icon: Briefcase },
  { label: 'Invoices',  path: '/invoices',  icon: FileText },
  { label: 'Settings',  path: '/settings',  icon: Settings },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen">
      <main className="pb-16">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-14 bg-card border-t border-border">
        <div className="flex h-full items-center justify-around">
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-2 text-xs',
                isActive(path) ? 'text-green-600' : 'text-muted-foreground'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
