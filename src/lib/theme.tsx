import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeId =
  | 'field-ops'
  | 'terrain-scan'
  | 'brutalist'
  | 'carbon-night'
  | 'weathered-signal'
  | 'veilance'

export type Theme = {
  id: ThemeId
  name: string
  tagline: string
  swatch: [string, string, string] // [bg, card, primary]
}

export const THEMES: Theme[] = [
  {
    id: 'field-ops',
    name: 'Field Ops',
    tagline: 'Deep forest, zero radius',
    swatch: ['oklch(0.09 0.022 148)', 'oklch(0.13 0.028 148)', 'oklch(0.82 0.23 148)'],
  },
  {
    id: 'terrain-scan',
    name: 'Terrain Scan',
    tagline: 'Teal dark, tight radius',
    swatch: ['oklch(0.10 0.022 185)', 'oklch(0.14 0.028 185)', 'oklch(0.78 0.18 185)'],
  },
  {
    id: 'brutalist',
    name: 'Brutalist',
    tagline: 'Black/white, no motion',
    swatch: ['oklch(0.0 0 0)', 'oklch(0.08 0 0)', 'oklch(1.0 0 0)'],
  },
  {
    id: 'carbon-night',
    name: 'Carbon Night',
    tagline: 'Blue-black, amber accent',
    swatch: ['oklch(0.10 0.015 245)', 'oklch(0.14 0.018 245)', 'oklch(0.76 0.17 70)'],
  },
  {
    id: 'weathered-signal',
    name: 'Weathered Signal',
    tagline: 'Dark green, hi-vis yellow',
    swatch: ['oklch(0.10 0.020 145)', 'oklch(0.14 0.022 145)', 'oklch(0.89 0.18 80)'],
  },
  {
    id: 'veilance',
    name: 'Veilance',
    tagline: 'Blue-black, system font',
    swatch: ['oklch(0.09 0.016 240)', 'oklch(0.13 0.018 240)', 'oklch(0.76 0.19 162)'],
  },
]

const STORAGE_KEY = 'gw-theme'
const DEFAULT_THEME: ThemeId = 'field-ops'

type ThemeContextType = {
  theme: ThemeId
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    return stored && THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function setTheme(id: ThemeId) {
    setThemeState(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
