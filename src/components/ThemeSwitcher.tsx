import { useState } from 'react'
import { Check, Paintbrush } from 'lucide-react'
import { cn } from '@/lib/utils'
import { THEMES, useTheme } from '@/lib/theme'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Backdrop — closes panel on outside click. Must live outside the z-50
          container so it doesn't inherit that stacking context and cover other UI. */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="fixed top-4 right-4 z-50">

      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'flex items-center justify-center size-9 rounded-md',
          'bg-card border border-border text-muted-foreground',
          'hover:text-foreground hover:border-ring/50 transition-colors duration-150',
          open && 'text-foreground border-ring/50'
        )}
        aria-label="Switch theme"
        title="Theme switcher"
      >
        <Paintbrush size={15} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 border border-border bg-card shadow-xl shadow-black/50 overflow-hidden rounded-md [animation:gw-enter_0.15s_ease_both]">

          {/* Header */}
          <div className="px-3 py-2 border-b border-border">
            <p className="text-[0.5rem] tracking-[0.2em] uppercase text-muted-foreground">
              Design Theme
            </p>
          </div>

          {/* Theme rows */}
          <div className="py-1">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left',
                  'hover:bg-muted transition-colors duration-100',
                  theme === t.id && 'bg-muted/60'
                )}
              >
                {/* 3-dot swatch */}
                <div className="flex gap-1 shrink-0">
                  {t.swatch.map((color, i) => (
                    <span
                      key={i}
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Name + tagline */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-none truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.tagline}</p>
                </div>

                {/* Active check */}
                {theme === t.id && <Check size={13} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </>
  )
}
