# Datasphere Design System — Persistent Rules

**These rules apply to ALL frontend development on Datasphere, in every session.**

## Mandatory: Read Before Any Frontend Work

Before implementing or modifying any page, component, or styling:

1. **Read the master design system:**
   `design-system/datasphere/MASTER.md`

2. **Check for page-specific overrides** (if they exist):
   `design-system/datasphere/pages/<page-name>.md`
   If the file exists, its rules override MASTER.md. Otherwise use MASTER.md exclusively.

3. **Review existing shared components** before creating new ones:
   - `src/components/Button.tsx`
   - `src/components/Badge.tsx`
   - `src/components/Pagination.tsx`
   - `src/components/Card.tsx`
   - `src/components/Input.tsx`
   - `src/components/Select.tsx`
   - `src/components/StatusBadge.tsx`

---

## Design Identity Summary

**Colors:** Indigo-blue primary (`#3B5BDB`), emerald accent (`#0CA678`), dark slate sidebar (`#1E2130`)
**Fonts:** Inter (UI/body), Fira Code (data values and code)
**Style:** Data-Dense Dashboard — light background, information-dense, restrained decoration

All colors are defined as CSS variables in `src/index.css` with the `--ds-` prefix.

---

## Non-Negotiable Rules

1. **No hardcoded hex colors** in component or page files — use `--ds-*` CSS variables or Tailwind classes that map to them.
2. **No new font families** — use only Inter and Fira Code.
3. **No independent navigation** — all features appear as `NavLink` entries in `src/layouts/AppLayout.tsx`.
4. **Reuse before creating** — always check `src/components/` first.
5. **No emoji as icons** — SVG only.
6. **Focus states required** — every interactive element must have a visible focus ring.
7. **Transitions required** — use 150ms ease on color, background, border, opacity changes.
8. **No buttons without working functionality** — no placeholder interactive elements.
9. **Ask before changing design system** — major visual changes (colors, fonts, layout) require approval.
10. **Run `npm run test && npm run build`** after any significant frontend change.

---

## Consistency Check (before marking work complete)

- [ ] Colors use `--ds-*` variables or approved Tailwind mappings
- [ ] No new font families introduced
- [ ] All new interactive elements have focus rings and hover states
- [ ] New features added to sidebar navigation in `AppLayout.tsx`
- [ ] `npm run test` passes, `npm run build` exits 0

---

*Design authority: `design-system/datasphere/MASTER.md`*
*Last updated: 2026-11-17*
