import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useColorMode } from '@/lib/colorMode'

export default function ColorModeToggle() {
  const { mode, toggle } = useColorMode()

  return (
    <button
      onClick={toggle}
      className={cn(
        'fixed top-4 right-4 z-50',
        'flex items-center justify-center size-9 rounded-md',
        'bg-card border border-border text-muted-foreground',
        'hover:text-foreground hover:border-ring/50 transition-colors duration-150'
      )}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
