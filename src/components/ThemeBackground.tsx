import { useTheme } from '@/lib/theme'

// Topographic contour lines — renders for field-ops, terrain-scan, weathered-signal.
// Uses currentColor so the stroke follows the theme's primary via text-primary on the SVG.
function TopoLines() {
  return (
    <svg
      className="fixed inset-0 w-full h-full pointer-events-none text-primary"
      viewBox="0 0 400 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {[38, 76, 116, 160, 208, 260, 316].map((r, i) => (
        <ellipse
          key={i}
          cx="200"
          cy="430"
          rx={r * 1.6}
          ry={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
          strokeOpacity={Math.max(0.01, 0.055 - i * 0.006)}
        />
      ))}
    </svg>
  )
}

// CRT-style scanlines — field-ops only
function Scanlines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, transparent 0, transparent 1px, oklch(0 0 0 / 1%) 1px, oklch(0 0 0 / 1%) 2px)',
      }}
      aria-hidden="true"
    />
  )
}

// Carbon fiber weave — carbon-night only
function CarbonWeave() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(45deg, oklch(1 0 0 / 2%) 0, oklch(1 0 0 / 2%) 1px, transparent 0, transparent 50%),
          repeating-linear-gradient(-45deg, oklch(1 0 0 / 2%) 0, oklch(1 0 0 / 2%) 1px, transparent 0, transparent 50%)
        `,
        backgroundSize: '4px 4px',
      }}
      aria-hidden="true"
    />
  )
}

export default function ThemeBackground() {
  const { theme } = useTheme()

  return (
    <>
      {(theme === 'field-ops' || theme === 'terrain-scan' || theme === 'weathered-signal') && (
        <TopoLines />
      )}
      {theme === 'field-ops' && <Scanlines />}
      {theme === 'carbon-night' && <CarbonWeave />}
    </>
  )
}
