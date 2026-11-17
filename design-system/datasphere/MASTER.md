# Datasphere — Master Design System

> **Single Source of Truth** for all visual design decisions in Datasphere.
> Every page, component, and feature must follow this specification.
> Generated and curated with ui-ux-pro-max · Last updated: 2026-11-17

---

## 1. Brand Identity

**Product:** Datasphere — A browser-based data workspace
**Mission:** Make working with data simple, accurate, and accessible
**Personality:** Precise, calm, trustworthy, professional, modern
**Style:** Data-Dense Dashboard — light-primary, information-dense, restrained decoration

---

## 2. Color System

### CSS Variables (defined in `src/index.css`)

```css
:root {
  /* Core palette */
  --ds-primary:         #3B5BDB;   /* Indigo blue — primary actions, links, active states */
  --ds-primary-hover:   #2F4AC7;   /* Darker primary for hover */
  --ds-primary-light:   #EEF2FF;   /* Very light indigo tint — active nav bg, pill bg */
  --ds-primary-mid:     #C5D0FA;   /* Medium tint — borders on active items */

  /* Accent */
  --ds-accent:          #0CA678;   /* Emerald — success, positive deltas, confirmations */
  --ds-accent-light:    #E6FCF5;   /* Light emerald tint */

  /* Warning / amber */
  --ds-warning:         #E67700;   /* Amber — outlier flags, caution states */
  --ds-warning-light:   #FFF3CD;   /* Light amber tint */

  /* Danger / destructive */
  --ds-danger:          #D63939;   /* Red — errors, destructive actions */
  --ds-danger-light:    #FFE0E0;   /* Light red tint */

  /* Neutrals (slate scale) */
  --ds-bg:              #F8F9FB;   /* Page background */
  --ds-surface:         #FFFFFF;   /* Card / panel surface */
  --ds-surface-raised:  #FFFFFF;   /* Elevated surface (same as surface for now) */
  --ds-sidebar:         #1E2130;   /* Sidebar dark background */
  --ds-sidebar-hover:   #2A2F45;   /* Sidebar nav hover */
  --ds-sidebar-active:  #3B5BDB;   /* Sidebar active item background */

  /* Text */
  --ds-text-primary:    #0F172A;   /* Primary body text — high contrast */
  --ds-text-secondary:  #475569;   /* Secondary / caption text */
  --ds-text-muted:      #94A3B8;   /* Muted / placeholder text */
  --ds-text-on-dark:    #E2E8F0;   /* Text on dark sidebar */
  --ds-text-on-primary: #FFFFFF;   /* Text on primary-colored backgrounds */

  /* Borders */
  --ds-border:          #E2E8F0;   /* Default border */
  --ds-border-strong:   #CBD5E1;   /* Stronger border for emphasis */
  --ds-border-focus:    #3B5BDB;   /* Focus ring color */

  /* Changed-cell highlight (data comparison) */
  --ds-cell-changed:    #FFF9E6;   /* Light amber for changed cells */
  --ds-cell-changed-text: #92400E; /* Text in changed cells */
}
```

### Semantic color usage

| Token | Use |
|---|---|
| `--ds-primary` | Buttons (primary), active nav, links, focus rings, progress |
| `--ds-primary-light` | Active nav background, selected chips, info banners |
| `--ds-accent` | Success states, "cleaned" indicators, row count delta (positive) |
| `--ds-warning` | Outlier flags, non-critical warnings |
| `--ds-danger` | Errors, file-rejection messages, destructive button |
| `--ds-sidebar` | Left sidebar background — always dark |
| `--ds-bg` | Page/app background |
| `--ds-surface` | Cards, panels, table backgrounds |
| `--ds-border` | All dividers, card borders, input borders |

---

## 3. Typography

### Font Families

```css
/* Import in src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');

:root {
  --ds-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --ds-font-mono: 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
}
```

**Rationale:**
- **Inter** — the most readable UI sans-serif for dense data interfaces; superior at small sizes
- **Fira Code** — used for data cell values, file names, and code snippets only

### Type Scale (Tailwind class equivalents)

| Role | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `page-title` | 22px / `text-[22px]` | 700 | 1.3 | Page H1 headings |
| `section-title` | 16px / `text-base` | 600 | 1.4 | Section H2, card titles |
| `label` | 13px / `text-[13px]` | 500 | 1.4 | Form labels, column headers |
| `body` | 14px / `text-sm` | 400 | 1.6 | Body copy, descriptions |
| `caption` | 12px / `text-xs` | 400 | 1.5 | Helper text, timestamps, footnotes |
| `code` | 13px | 400 | 1.5 | Data values, filenames — font-mono |

### Rules
- Maximum body text width: 680px (prose sections)
- Table cells: 13px, font-normal, `font-mono` for data values
- Never use `font-size < 11px`
- Heading hierarchy: only one `h1` per page; never skip levels

---

## 4. Spacing System

Based on a **4px base unit**. Tailwind classes map directly:

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--ds-space-1` | 4px | `p-1` | Minimal inset |
| `--ds-space-2` | 8px | `p-2` | Compact padding |
| `--ds-space-3` | 12px | `p-3` | Standard cell padding |
| `--ds-space-4` | 16px | `p-4` | Card/section inset |
| `--ds-space-5` | 20px | `p-5` | Generous card padding |
| `--ds-space-6` | 24px | `p-6` | Section spacing |
| `--ds-space-8` | 32px | `p-8` | Page section gap |
| `--ds-space-12` | 48px | `p-12` | Major section break |

### Layout Spacing
- Sidebar width: `224px` fixed
- Main content max-width: `1200px` centered
- Page horizontal padding: `px-6` (24px)
- Page vertical padding: `py-8` (32px)
- Card gap in grids: `gap-4` (16px)

---

## 5. Border Radius

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--ds-radius-sm` | 4px | `rounded` | Badges, chips, small tags |
| `--ds-radius-md` | 8px | `rounded-lg` | Buttons, inputs, dropdowns |
| `--ds-radius-lg` | 12px | `rounded-xl` | Cards, panels, modals |
| `--ds-radius-xl` | 16px | `rounded-2xl` | Upload zone, hero cards |
| `--ds-radius-full` | 9999px | `rounded-full` | Avatars, circular indicators |

---

## 6. Shadows & Elevation

```css
:root {
  --ds-shadow-sm:   0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ds-shadow-md:   0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -1px rgb(0 0 0 / 0.04);
  --ds-shadow-lg:   0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -2px rgb(0 0 0 / 0.04);
  --ds-shadow-card: 0 0 0 1px var(--ds-border), 0 1px 3px 0 rgb(0 0 0 / 0.05);
}
```

- Use `--ds-shadow-sm` for inputs and buttons on hover
- Use `--ds-shadow-card` for all data panels and cards (border + shadow together)
- Use `--ds-shadow-md` for dropdowns and popovers
- Use `--ds-shadow-lg` for modals

---

## 7. Layout & Navigation

### Application Shell
- **Sidebar:** Fixed left, `224px` wide, dark background (`--ds-sidebar: #1E2130`)
- **Main area:** Scrollable, `flex-1`, light background (`--ds-bg`)
- **Mobile:** Sidebar hides, top bar shows nav links

### Sidebar Structure
```
Datasphere logo + wordmark
────────────────────────────
Main Navigation
  · Overview
  · Data Cleaning
────────────────────────────
(Future sections added here)
────────────────────────────
Version / legal footer
```

### Sidebar nav item states
- Default: `text-slate-300`, `hover:bg-[--ds-sidebar-hover]`
- Active: `bg-[--ds-primary]`, `text-white`, left border accent `border-l-2 border-blue-300`

### Page header pattern
Every page has a consistent header block:
```
H1 title (22px, font-semibold, text-primary)
Subtitle (14px, text-secondary)
─── optional breadcrumb / step indicator
```

---

## 8. Component Specifications

### Button

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| `primary` | `--ds-primary` | white | none | `--ds-primary-hover` |
| `secondary` | white | `--ds-text-primary` | `--ds-border-strong` | `bg-slate-50` |
| `ghost` | transparent | `--ds-text-secondary` | none | `bg-slate-100` |
| `danger` | `--ds-danger` | white | none | darker red |
| `success` | `--ds-accent` | white | none | darker emerald |

- Height: `sm=32px`, `md=36px`, `lg=40px`
- Padding: `sm=px-3`, `md=px-4`, `lg=px-5`
- Border radius: `rounded-lg` (8px)
- Disabled: `opacity-50 cursor-not-allowed`
- Focus: `ring-2 ring-[--ds-border-focus] ring-offset-2`
- Icon buttons: 36×36px minimum, `rounded-lg`

### Input / Select

```css
/* Base input */
border: 1px solid var(--ds-border-strong);
border-radius: var(--ds-radius-md);  /* 8px */
padding: 7px 12px;
font-size: 14px;
background: var(--ds-surface);
color: var(--ds-text-primary);
transition: border-color 150ms, box-shadow 150ms;

/* Focus */
border-color: var(--ds-border-focus);
box-shadow: 0 0 0 3px color-mix(in srgb, var(--ds-primary) 15%, transparent);
```

### Card

```css
background: var(--ds-surface);
border: 1px solid var(--ds-border);
border-radius: var(--ds-radius-lg);  /* 12px */
padding: 20px;
box-shadow: var(--ds-shadow-card);
```

### Badge / Chip

```css
display: inline-flex;
align-items: center;
padding: 2px 8px;
border-radius: var(--ds-radius-sm);  /* 4px */
font-size: 12px;
font-weight: 500;
```

| Variant | Background | Text |
|---|---|---|
| `info` | `--ds-primary-light` | `--ds-primary` |
| `success` | `--ds-accent-light` | `#065F46` |
| `warning` | `--ds-warning-light` | `--ds-warning` |
| `danger` | `--ds-danger-light` | `--ds-danger` |
| `neutral` | `#F1F5F9` | `--ds-text-secondary` |

### Checkbox

- 16×16px, `rounded` (4px)
- Checked: `--ds-primary` background, white check
- Focus: `ring-2 ring-[--ds-primary]`

---

## 9. Data Table Styling

```css
/* Table wrapper */
overflow-x: auto;
border: 1px solid var(--ds-border);
border-radius: var(--ds-radius-lg);
background: var(--ds-surface);

/* Header row */
background: #F8FAFC;
border-bottom: 1px solid var(--ds-border-strong);
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.04em;
color: var(--ds-text-secondary);
padding: 10px 12px;

/* Data rows */
font-size: 13px;
font-family: var(--ds-font-mono);
color: var(--ds-text-primary);
padding: 8px 12px;
border-bottom: 1px solid var(--ds-border);

/* Row hover */
background: #F8FAFF;

/* Null cell */
color: var(--ds-text-muted);
font-style: italic;
font-family: var(--ds-font-sans);

/* Changed cell (cleaning results) */
background: var(--ds-cell-changed);
color: var(--ds-cell-changed-text);
font-weight: 500;
```

---

## 10. Issue Panel & Cleaning Cards

Each issue card:
- Full-width card with `--ds-shadow-card`
- Left border: `4px solid <issue-color>` for visual category
- Header: icon + badge + affected count
- Body: explanation + example in monospace box
- Action area: checkboxes + conditional controls
- Color coding per issue kind:

| Kind | Color | Left border |
|---|---|---|
| `missing_values` | amber | `#E67700` |
| `duplicate_rows` | orange | `#E8590C` |
| `whitespace` | blue | `#1971C2` |
| `numeric_as_text` | violet | `#6741D9` |
| `inconsistent_casing` | teal | `#0F9B8E` |
| `outliers` | red | `#D63939` |

---

## 11. Upload Zone

- Dashed border: `2px dashed --ds-border-strong`, `rounded-2xl` (16px)
- Hover / drag-over: border color `--ds-primary`, background `--ds-primary-light`
- Loading: animated spinner (pure CSS), no layout shift
- Error: red border + inline error block below
- Icon: 48×48px upload arrow in a circle
- Height: min `200px`, centered content

---

## 12. Interaction & Animation

```css
/* Standard micro-transition */
transition: color 150ms ease, background-color 150ms ease,
            border-color 150ms ease, box-shadow 150ms ease,
            opacity 150ms ease;

/* Transform transitions */
transition: transform 200ms ease;
```

- Hover color/bg: 150ms ease
- Loading spinners: use CSS `animate-spin` only
- No GSAP, no scroll animations, no parallax — data tool, not marketing page
- Respect `prefers-reduced-motion: reduce` — disable all transitions

---

## 13. Responsive Breakpoints

| Breakpoint | Min-width | Description |
|---|---|---|
| `sm` | 640px | Mobile landscape / small tablet |
| `md` | 768px | Tablet — sidebar appears |
| `lg` | 1024px | Small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large display |

- Sidebar: hidden `< md`, visible `≥ md`
- Main content: stacked on mobile, side-by-side `≥ xl`
- Before/after tables: stacked on mobile, side-by-side `≥ xl`

---

## 14. Accessibility Requirements

- All interactive elements: visible focus ring (not `outline: none`)
- Color contrast: body text ≥ 4.5:1, large text ≥ 3:1
- Buttons and inputs: descriptive `aria-label` when icon-only
- Tables: `<th scope="col">` headers
- Errors: `role="alert"` for inline error messages
- Loading: `aria-busy="true"` on containers that are loading
- `prefers-reduced-motion` media query: disable transitions and animations

---

## 15. Rules for New Pages & Features

1. **Read MASTER.md** before implementing any new page or component
2. **Check `design-system/datasphere/pages/<page-name>.md`** for page-specific overrides
3. **Use existing shared components** from `src/components/` and `src/features/cleaning/components/`
4. **No independent color values** — always reference CSS variables or Tailwind classes mapped to them
5. **No custom font-size, font-weight, or line-height** outside the type scale
6. **New reusable components** go in `src/components/`; feature-specific components go in their feature folder
7. **Sidebar navigation**: add new features as `NavLink` entries in `AppLayout.tsx` — no separate nav systems
8. **Card pattern**: all information panels use the standard card specification above
9. **Consistency check**: compare new pages visually against the Overview and Data Cleaning pages before shipping
10. **Major visual changes**: must update this MASTER.md and obtain approval before implementation

---

## 16. File Locations

| Asset | Path |
|---|---|
| CSS tokens | `src/index.css` |
| Tailwind config | `vite.config.ts` (via `@tailwindcss/vite`) |
| Shared components | `src/components/` |
| Feature components | `src/features/<feature>/components/` |
| Design system docs | `design-system/datasphere/` |
| Bob persistent rules | `.bob/rules/design-system.md` |
| Project-wide rules | `AGENTS.md` |

---

*This document is the design authority for Datasphere. When in doubt, follow this spec.*
