# Datasphere — Project Rules for AI Assistants

This file governs AI-assisted development on Datasphere. All agents, assistants,
and automated tools must follow these rules in every session.

## Repository

- **Language:** TypeScript + React 19 + Vite 6 + Tailwind CSS 4
- **Main branch:** `main` — work directly on main unless instructed otherwise
- **Do not** commit, push, or create branches without explicit user approval

## Design System (MANDATORY)

Before implementing ANY frontend change, page, or component:

1. **Read:** `design-system/datasphere/MASTER.md`
2. **Check page overrides:** `design-system/datasphere/pages/<page>.md`
3. **Review existing components:** `src/components/`
4. **Follow the persistent Bob rule:** `.bob/rules/design-system.md`

The Datasphere design system uses:
- **Primary color:** `#3B5BDB` (indigo), referenced as `--ds-primary`
- **Fonts:** Inter (UI) + Fira Code (data values)
- **Style:** Data-Dense Dashboard, light-mode primary
- **CSS tokens:** All design values defined in `src/index.css` with `--ds-` prefix

**No hardcoded colors, fonts, or spacing outside the design system.**
**No alternative navigation systems — all features go into `AppLayout.tsx`.**
**No emoji icons — SVG only.**

## Architecture

```
src/
  components/          # Shared reusable UI components — check here first
  features/cleaning/   # Data cleaning feature (parser, detector, cleaner, exporter)
  layouts/AppLayout.tsx # App shell — sidebar + main content
  pages/               # Route-level page components
  data/                # Static data (sample dataset)
  index.css            # CSS custom properties (design tokens)
```

## Development Standards

- Run `npm run test` after logic changes; run `npm run build` after UI changes
- All public interactive elements need ARIA labels or visible text
- Preserve all existing data-cleaning functionality when making UI changes
- 64 existing tests must remain passing

## Data Cleaning Feature

Do not modify these files without explicit instruction:
- `src/features/cleaning/lib/parser.ts`
- `src/features/cleaning/lib/detector.ts`
- `src/features/cleaning/lib/cleaner.ts`
- `src/features/cleaning/lib/exporter.ts`

These implement the actual cleaning algorithms. UI can be redesigned freely;
the lib/ functions are the source of truth for data processing behavior.

## Team Collaboration

- Both developers share this repository and these standards
- Design system lives in `design-system/datasphere/`
- Bob rules live in `.bob/rules/`
- Ask before making architectural changes that affect both developers
