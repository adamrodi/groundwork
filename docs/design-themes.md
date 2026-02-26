# Design Themes

Visual design research and theme concepts for Groundwork. Not a decision doc — a reference for when pages are built. Keep it fun and minimal; design should never detract from usability.

---

## Existing design DNA

The Login page establishes a vocabulary worth knowing before departing from it.

| Element | Current value | Where it lives |
|---|---|---|
| Display font | Barlow Condensed 900 | `--font-display` |
| Body/data font | DM Mono 400/500 | `--font-sans` |
| Background | `oklch(0.11 0.025 148)` — dark green-black | `:root` |
| Primary | `oklch(0.79 0.21 148)` — vivid spring green | `:root` |
| Background texture | Topographic SVG ellipses | Login.tsx |
| Motion | `gw-enter` (fade-up), `gw-grow-x` (line-draw), `pulse-glow` | `index.css` |
| Signature element | Eyebrow label + pulsing dot | Login.tsx |

The topographic ellipses, pulsing crosshair, and numbered field labels (`01`, `02`) are the strongest original elements. Every theme below considers whether to carry them forward, evolve them, or replace them.

---

## Ten themes

---

### 1 — FIELD OPS TERMINAL
*Current direction, fully committed*

The screen belongs in a command post tent. Military-grade field readout, dark phosphor green, sparse instrumentation. The login page is ~40% of this — extend it systematically.

**The unforgettable detail:** A faint scanline overlay across the entire app:
```css
repeating-linear-gradient(to bottom, transparent 0, transparent 1px, oklch(0 0 0 / 1%) 1px, oklch(0 0 0 / 1%) 2px)
```
Like a CRT display.

**Typography:** Keep Barlow Condensed 900 for all page titles at `clamp(3.5rem, 18vw, 5.5rem)`. DM Mono for every number and label. Numeric field prefixes (`01 —`, `02 —`) on all form labels. Status text as 1-letter flags: `D` draft, `S` sent, `P` paid.

**Color:** Deepen background to `oklch(0.08 0.02 148)` (closer to true black). Keep vivid primary. Add amber `oklch(0.75 0.15 75)` for pending states — military signal color.

**Layout vocabulary:** Cards defined purely by lightness steps (no borders, no shadows). Dividers grow in from left using `gw-grow-x`. Section headers uppercase with wide tracking. Crosshair indicator at top-left on every page.

**Navigation:** Bottom bar as an instrument strip — each tab has a tiny label in `0.4375rem` tracking caps, active state is the pulsing dot.

**Pages:**
- **Dashboard:** Four stat tiles in 2×2 grid — `REVENUE MTD`, `JOBS OPEN`, `INVOICES SENT`, `CLIENTS ACTIVE`. Large DM Mono numbers, dim labels above. Below: a scrollable "terminal log" of recent jobs: `[date] [client] [status]`.
- **Clients:** "ROSTER" — each client is a numbered row (`001`, `002`), name in Barlow Condensed, phone/email as faint secondary. Pulsing dot precedes clients with open jobs.
- **Jobs:** "FIELD LOG" with date-grouped sections. Each date is an uppercase separator line. Status badges: square/no-radius, `0.4375rem` font, `0.2em` tracking.
- **Invoices:** "LEDGER" — invoice number in primary color, client name, date, amount right-aligned in DM Mono, 1-char status flag.

---

### 2 — FIELD NOTEBOOK
*Analog meets digital*

A Rite-in-the-Rain waterproof notebook carried in a back pocket. Spiral-bound, graph-ruled pages, rubber-stamped dates. The digital equivalent of physical artifacts already in Salim's workflow.

**The unforgettable detail:** CSS graph-paper background on all cards:
```css
background-image:
  linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px),
  linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px);
background-size: 24px 24px;
```

**Typography pivot:** Switch display font to a condensed slab — `Libre Baskerville Italic` or `Playfair Display Bold` — to suggest stamped letterhead rather than military readout. Keep DM Mono for all data.

**Color:** Stay dark but shift from green-black to warm brown-black `oklch(0.10 0.03 85)` — a soaked leather notebook cover. Primary accent: deep muted forest green `#2D6A2D`. Red ochre `#C84B1C` for overdue/urgent (a teacher's red pen).

**Signature elements:** Page titles as rubber stamps — slight letter-press shadow, all-caps. Completed jobs get a diagonal strikethrough + small checkmark stamp icon. Input borders draw in from left on focus (pen underlining text).

**Pages:**
- **Dashboard:** Open notebook summary page. Date stamp (`FEB 26` in large condensed serif) at top. Two-column layout with handwritten-style section headers. Stats inline with content, not isolated tiles.
- **Clients:** Address-book entries — name in larger serif, contact details in smaller mono. A–Z index strip on the right edge.
- **Jobs:** Log page with date stamps on the left margin, job descriptions extending right. Completed = diagonal strikethrough + green checkmark stamp.
- **Invoices:** Actual handwritten-style invoice template. Invoice number top-right (large, like a pre-printed form number). Client address block on left. Itemized table with ruled lines. Total boxed in thick border.

---

### 3 — BRUTALIST LEDGER
*Typography as architecture*

German Bauhaus ledger book. Swiss government form. Obsessively rational — the grid is the design. No decoration. No `border-radius`. No shadows. No icons.

**The unforgettable detail:** "GROUNDWORK" at whatever size exactly fills the screen width on each device — true fluid display type that breaks no rules, just stretches to the container edge.

**Typography:** One weight pair only — `font-weight: 900` for display, `font-weight: 400` for data. Numbers are the visual heroes at `3rem` or larger. Labels are `0.375rem` — the smallest readable size.

**Color:** Push to pure black `#000000` / pure white `#FFFFFF`. The green survives only for the single most important element per screen. Alternating `#ffffff08` / transparent table rows — classic ledger striping.

**Layout rules:** No padding inside cards — content bleeds to container edge. Full-width dividers, zero rounding. Status rendered as `[ PENDING ]` `[ COMPLETE ]` — literal square brackets, monospace.

**Motion:** None. Cut on tap. Any animation feels wrong here. The restraint is the statement.

**Pages:**
- **Dashboard:** "GROUNDWORK" spans full screen width. Thick white rule below it. Four numbers stacked: revenue, jobs, invoices, clients. Each enormous. Each label `0.375rem`. Nothing else.
- **Clients:** A pure table. Column headers uppercase. No avatar, no card. Selected row inverts: white background, black text.
- **Jobs:** Identical table treatment. Status: `[ PENDING ]` or `[ COMPLETE ]`. Date column always `YYYY-MM-DD`.
- **Invoices:** Plain tabulation. Invoice detail: full-screen form with a thick border box around the total — the entire screen organized around the money amount at 80px.

---

### 4 — TERRAIN SCAN
*Topographic extended to the full app*

A precision mapping instrument — drone survey interface, USGS topo quad sheet. The ellipses on the login page are the seed; this grows them into a complete visual system.

**The unforgettable detail:** Every page has a unique topographic SVG background. Dashboard gets radial contours centered on screen. Clients page gets parallel horizontal lines (flat terrain cross-section). Jobs gets a gradient mesh. The background IS the page identity.

**Color vocabulary from real topo maps:**
- Elevation tints: background `L=0.09`, cards `L=0.13`, popovers `L=0.17`, tooltips `L=0.22` — each step is a higher elevation
- Secondary teal `oklch(0.72 0.12 185)` for completed/confirmed (water features on real maps)
- Amber for `paid` invoice state — summit gold
- `paid` status gets a hexagonal "RECORDED" stamp

**Layout:** Cards are "elevation zones." Page titles include a `0.4375rem` coordinate label beneath them at `15%` opacity. Invoice numbers formatted as `GW-0047` — a map grid reference.

**Navigation:** Bottom nav tabs as compass quadrants. Active state: a small triangular summit marker pointing up.

**Pages:**
- **Dashboard:** Stat tiles with "elevation change" sparklines — tiny SVG cross-section profiles. Labels include decorative compass bearing text `N 43° 38'` at `0.4375rem`.
- **Clients:** Each client uses a USGS-style location pin as the avatar. Client detail has a `SITE` section for the address in coordinate-like formatting.
- **Jobs:** Field survey log entries. Status uses the terrain color progression: red = steep/danger, amber = intermediate, green = traversable/complete.
- **Invoices:** `GW-XXXX` invoice numbers. Hexagonal "RECORDED" stamp on paid invoices.

---

### 5 — OSAKA TOOL
*Japanese precision manufacturing*

Mitutoyo micrometer catalog. Makita power tool spec sheet. Dense information, obsessive precision, color used only for function.

**The unforgettable detail:** A horizontal ruler decorating the top of every page — `1px` line with `mm` tick marks at `8px` intervals at `6%` opacity. Purely decorative, unmistakably precise.

**Typography pivot:** Move to system fonts (`-apple-system`) — on Salim's iPhone this is San Francisco. Labels become lowercase and minimal: not "Email Address" but `email`. Not "Invoice Number" but `inv no`.

**Color:** Introduce `#D97316` safety orange (Makita's signature) for urgent/overdue states. Background shifts to deep brushed-steel blue-black `oklch(0.10 0.008 210)`. Hairline whites for structure.

**Layout vocabulary:** `1px` borders on all four sides of cards (not floating). No between-column separators except in summary rows. Numbers right-aligned in fixed-width columns with units in a separate faint span.

**Motion:** Instant. Sub-100ms only. Things just ARE in their state.

**Pages:**
- **Dashboard:** Production-floor readout. Stats in a horizontal strip at the top, each value in a bordered box like a meter reading. Job queue below sorted by priority.
- **Clients:** Manufacturing contact list. Each entry has a client code (`JDS-003`) in a faint left column.
- **Jobs:** Work orders. Job detail has an explicit `WORK ORDER` label and dashed border around the entire content area. Two-column form layout.
- **Invoices:** Remittance slip. Condensed header layout mimicking Japanese billing forms — date right, number left, double-rule separating header from items.

---

### 6 — CARBON FIBER NIGHT
*Vehicle instrument cluster*

Rivian infotainment. Land Rover Defender dash. Jeep off-road readout. Rich black with warm amber accents, subtle material texture.

**The unforgettable detail:** Repeating carbon-fiber weave pattern on the Dashboard hero area:
```css
background-image:
  repeating-linear-gradient(45deg, oklch(1 0 0 / 2%) 0, oklch(1 0 0 / 2%) 1px, transparent 0, transparent 50%),
  repeating-linear-gradient(-45deg, oklch(1 0 0 / 2%) 0, oklch(1 0 0 / 2%) 1px, transparent 0, transparent 50%);
background-size: 4px 4px;
```

**Typography:** Keep DM Mono for numbers. Move display font to `Geist` or `IBM Plex Sans Condensed`. Add `font-variant-numeric: tabular-nums slashed-zero` everywhere — the slashed zero is a powerful precision signal.

**Color:**
- Background: `oklch(0.07 0.012 240)` — deep cool blue-black
- Warm amber `oklch(0.76 0.17 70)` for warnings (instrument amber light)
- Status badges glow: `box-shadow: 0 0 8px currentColor` at low opacity
- Active/pressed: `box-shadow: inset 0 1px 0 oklch(1 0 0 / 15%)` — illuminated button ring

**Navigation:** Glass bottom bar — `backdrop-filter: blur(20px)` with `background: oklch(0.07 0.012 240 / 80%)`. Feels like a floating instrument panel.

**Pages:**
- **Dashboard:** Circular activity ring (SVG arc) showing jobs completed this week. Revenue in amber. Pending jobs as a scrollable queue with chevron-right affordances.
- **Clients:** Each client row has a `3px` left-side colored stripe — green for active, gray for dormant, amber for unpaid balance.
- **Jobs:** Elevated card shadows `0 2px 12px oklch(0 0 0 / 40%)`. Glowing green status badges.
- **Invoices:** Total amount in amber. Green dot = paid. Off/dark = unpaid.

---

### 7 — DEAD SIMPLE TOOL
*Anti-aesthetic as aesthetic*

What if Salim built it himself with Bootstrap and a designer cleaned it up without adding decoration? Basecamp / HEY energy. Radical clarity.

**The unforgettable detail:** The entire Dashboard is four full-width tappable rows — `3 Open Jobs →`, `$840 Outstanding →`, `12 Clients →`, `2 Invoices Sent →`. No tiles, no charts. Pure shortcut navigation.

**Typography:** System font only. Two weights: `600` for labels, `400` for data. No letter-spacing, no uppercase, no tracking. Numbers at `2rem`, body at `15px`, labels at `12px`.

**Color:** Simplify to Tailwind stock green `#16a34a` as the only accent. Background `#0a0a0a`, surface `#141414`, border `#2a2a2a`. Status: stock `#22c55e` / `#f59e0b` / `#ef4444`.

**What makes it interesting:** Client list items have auto-generated initials avatars with hue-shifted background colors (derived from name hash). Swipe-left on job rows reveals quick actions. The restraint creates a different kind of memorability.

**Pages:**
- **Dashboard:** Four tappable shortcut rows. That's it.
- **Clients:** Scrollable list with initials avatars. Long-tap for actions (Call, Text, New Job).
- **Jobs:** Filtered tabs: `Pending | This Week | Done`. Swipe-left: "Complete" and "Invoice" quick actions.
- **Invoices:** Tabs: `Draft | Sent | Paid`. Number badges on each tab. Amount right-aligned in green (paid) / amber (sent) / muted (draft).

---

### 8 — WEATHERED SIGNAL
*Job site wayfinding*

Hand-painted sign on a tool shed. Spray-painted stencil on a steel tool box. The visual language of professional trades signage — bold, legible from 20 feet, no decoration. Every piece of text could be read through a dusty glove.

**The unforgettable detail:** Each page section gets a `4px` left-border in the section's signal color — Dashboard: safety yellow `oklch(0.89 0.18 80)`, Clients: forest green, Jobs: safety orange `oklch(0.75 0.17 50)`, Invoices: clean white. You always know where you are.

**Typography:** Barlow Condensed 900 for EVERYTHING down to section headers. Status badges as `[ DONE ]` `[ OUT ]` stencils — literal square brackets, monospace.

**Color shift:** Safety yellow becomes the PRIMARY accent, replacing the current vivid green. Yellow-on-dark-green is the actual color of landscape equipment, survey stakes, safety vests. Green becomes the success/completion color. This feels immediately, specifically right for landscaping.

**Background:** The topographic SVG pattern moves from Login-only to a full-app background at `3%` opacity. Every screen has faint contour lines.

**Pages:**
- **Dashboard:** "GROUNDWORK" wordmark large, same as Login. Four sections as rectangular "sign panels" — full-width, heavily bordered, section name in large stenciled text.
- **Clients:** Names in Barlow Condensed Medium (Black reserved for section titles). Category shown as a small rectangular tag in safety yellow.
- **Jobs:** Status: stenciled rectangular badges `[ DONE ]` `[ OUT ]`. Date column highlighted in safety yellow if job is today.
- **Invoices:** Invoice amount as the hero on each row. Status uses sign-color system: yellow = draft, green = sent, white = paid.

---

### 9 — PAPER RECEIPT
*The invoice artifact, literalized*

The thermal receipt Salim hands to a client. Monospace typewriter text, cream paper, dot-leaders filling the price column. Works best as a contextual variant for Invoice views rather than the whole app.

**The unforgettable detail:** Dot-leaders in item lists — `Item description ............. $60.00`. Totals get double-underline. Void invoices get a diagonal `VOID` stamp in red.

**Typography:** `Courier Prime` or `Courier New` exclusively. Headers achieved through `=====` separator lines and ALL CAPS. Single fixed size `14px`. The monotony of the typeface is the aesthetic.

**Best use:** Not a whole-app theme — but the Invoice detail page and the client-facing `/i/:id` public invoice view are perfect for this. The contrast between a "designed" internal app and a receipt-style public invoice creates a memorable tension.

**Example Dashboard:**
```
GROUNDWORK FIELD OPS
====================
DATE: FEB 26 2026
====================
REVENUE MTD.....$840
JOBS OPEN..........3
INVOICES SENT......2
--------------------
[→ VIEW JOBS]
[→ VIEW INVOICES]
```

---

### 10 — VEILANCE
*Premium technical outdoor gear*

Arc'teryx's luxury performance line, translated to software. Dark controlled backgrounds, white/gray text, a single pop of green. Every pixel justified by function. Expensive-feeling without decoration.

**The unforgettable detail:** The wordmark "GROUNDWORK" in a stretched ultra-wide tracked format — `letter-spacing: 0.15em`, `font-weight: 300`. The Arc'teryx logo treatment. Quiet, confident, not trying.

**Typography:** System fonts. San Francisco on Salim's iPhone is perfect. Barlow Condensed survives only for stat callouts. Body type small and precise: `12px` labels, `15px` body.

**Color:**
- Background: `oklch(0.07 0.008 220)` — cool blue-black (no green tint in the background, only in the accent)
- This makes the green primary read as vivid and natural against cool darkness
- Status: green for active, warm sand `oklch(0.72 0.12 50)` for pending (khaki / technical fabric), red for overdue

**Motion:** Refined easing `cubic-bezier(0.25, 0.46, 0.45, 0.94)`. Cross-fade page transitions at `180ms`. List items stagger `30ms` apart with `translateY: 4px → 0`. `scale: 0.97` press state — physical without being obvious.

**Navigation:** Glass bottom bar. Client list gets an iOS-style index scrubber. Job cards have `12px` radius (the only theme with rounded cards). Invoice detail has a bottom action bar: `Send`, `Mark Paid`, `PDF`.

**Pages:**
- **Dashboard:** Large hero section with the most important number + minimal sparkline. Three compact summary rows (Clients, Jobs, Invoices) with counter and chevron — the "shop by category" tile pattern applied to data.
- **Clients:** Alphabetically indexed list. Generated monogram avatars in muted colors. Detail page: large name at top, tightly organized info blocks, inline contact action pills.
- **Jobs:** Card-based (not list-based). Subtle `3px` left-side status stripe on each card. Job description is the largest text.
- **Invoices:** Amount right-aligned, status as a small pill badge, date and client on left. Bottom action bar on detail view.

---

## Cross-cutting ideas (theme-independent)

These apply regardless of direction chosen.

**Color-coded sections.** Each section of the app gets a hue or accent variation — not dramatically different, just enough that the active bottom nav tab and the page header feel coordinated. Clients = green, Jobs = orange/amber, Invoices = white/yellow, Dashboard = neutral.

**The `01 —` label system.** Numbered field prefixes from the Login page extend to every form and data row. Clients numbered `001`, `002`. Invoices `GW-0047`. Jobs get a field-log index. Creates a through-line without a visual style change.

**Status as single character.** On list views, status is 1 char in a fixed-width mono slot: `·` pending, `✓` complete, `$` paid, `!` overdue. Saves column space on mobile, looks intentional.

**Swipe gestures on list rows.** Swipe left reveals action buttons (Complete, Invoice, Delete). Works across Jobs and Invoices. Matches native iOS patterns Salim already knows.

**Topographic background as app signature.** Currently lives only on Login. Moving it to every page at lower opacity would be the single highest-impact cohesion change — almost free to implement.

**Glass bottom nav.** `backdrop-filter: blur(16-20px)` on the nav bar reads as "premium PWA" rather than "mobile website." Works across nearly all themes.

**Pull-to-refresh indicator.** Styled as a compass needle spinning or a contour ring expanding — a small branded moment that appears frequently on mobile.

**Empty states as personality moments.** When Clients is empty: `No clients yet. Add your first.` When Jobs is empty: `Nothing here. Good day off?` Small, cheap, memorable.

---

## What's compatible vs. exclusive

| Feature | Works across themes | Theme-specific |
|---|---|---|
| Topographic background SVG | All except 3 | — |
| Numbered field labels `01 —` | All | — |
| `gw-enter` / `gw-grow-x` animations | 1, 4, 6, 8, 10 | Not 3 (Brutalist) |
| Pulsing green dot | 1, 4, 6 | — |
| Barlow Condensed display | 1, 3, 4, 8 | Not 5, 7, 10 |
| Safety yellow primary accent | 8 only | — |
| Carbon weave texture | 6 only | — |
| Glass bottom nav | 6, 10 | — |
| System fonts | 5, 7, 10 | Not 1, 2, 3 |
| Rounded cards | 10 | All others sharp |
| Receipt/dot-leader formatting | 9 (Invoice views) | — |
