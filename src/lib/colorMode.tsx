import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type ColorMode = 'dark' | 'light'

type ColorModeContextType = {
  mode: ColorMode
  toggle: () => void
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'dark',
  toggle: () => {},
})

const STORAGE_KEY = 'gw-color-mode'

function resolveInitialMode(): ColorMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(resolveInitialMode)

  useEffect(() => {
    const root = document.documentElement
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  function toggle() {
    setMode(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  return useContext(ColorModeContext)
}
