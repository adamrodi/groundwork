# Design Themes

Visual design reference for Groundwork. Theme 1 is the committed direction. Themes 2-10 are archived inspiration.

---

## Existing design DNA

The Login page establishes the core vocabulary:

| Element | Value | Where |
|---|---|---|
| Display font | Barlow Condensed 900 | `--font-display` |
| Body/data font | DM Mono 400/500 | `--font-sans` |
| Background | `oklch(0.11 0.025 148)` dark green-black | `:root` |
| Primary | `oklch(0.79 0.21 148)` vivid spring green | `:root` |
| Background texture | Topographic SVG ellipses | Login.tsx |
| Motion | `gw-enter`, `gw-grow-x`, `pulse-glow` | `index.css` |

## Committed direction: Theme 1 — Field Ops Terminal

Military command post aesthetic. Dark phosphor green, sparse instrumentation, CRT scanline overlay.

- **Typography:** Barlow Condensed 900 for titles, DM Mono for numbers/labels. Numbered field prefixes (`01 —`, `02 —`).
- **Color:** Deep background `oklch(0.08 0.02 148)`, amber `oklch(0.75 0.15 75)` for pending states.
- **Layout:** Cards defined by lightness steps (no borders/shadows). Dividers grow in with `gw-grow-x`. Crosshair indicator on every page.
- **Navigation:** Bottom bar as instrument strip. Active state = pulsing dot. Tiny caps labels.
- **Signature detail:** Faint CRT scanline overlay across entire app.

## Cross-cutting patterns (theme-independent)

These work regardless of visual theme:

- **Numbered field labels** — `01 —`, `02 —` on form fields
- **Status as single character** — `·` pending, `✓` complete, `$` paid, `!` overdue
- **Topographic SVG at 3% opacity** — Cohesion element (currently Login-only, worth expanding)
- **Glass bottom nav** — `backdrop-filter: blur(16-20px)`
- **Empty states as personality** — Witty copy, e.g. "Nothing here. Good day off?"

## Archived themes (2-10)

Kept for inspiration only. Do not implement without explicit direction.

2. **Field Notebook** — Analog waterproof notebook, brown leather, graph paper
3. **Brutalist Ledger** — Swiss government form, pure black/white, `[ PENDING ]` brackets
4. **Terrain Scan** — Topographic map, elevation zones via lightness, coordinate labels
5. **Osaka Tool** — Japanese precision, safety orange, steel blue-black
6. **Carbon Fiber Night** — Vehicle instrument cluster, rich black, amber accents
7. **Dead Simple Tool** — Basecamp/HEY energy, system font, radical clarity
8. **Weathered Signal** — Job site signage, safety yellow, stenciled brackets
9. **Paper Receipt** — Thermal receipt, monospace Courier, dot-leaders
10. **Veilance** — Arc'teryx outdoor gear, cool blue-black, glassmorphism
