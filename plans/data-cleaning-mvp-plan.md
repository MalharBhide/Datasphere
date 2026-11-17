# Datasphere — Data Cleaning MVP Plan

## Overview

Build the first version of **Datasphere**, a client-side data workspace focused exclusively on **Data Cleaning**. The goal is a polished, fully functional MVP where a user can upload a CSV or XLSX file, detect data quality issues, apply selected cleaning operations, preview the results, and download the cleaned file — all in the browser with no backend.

**Scope:** One feature only — Data Cleaning. No backend. No auth. No AI.  
**Stack:** React + TypeScript, Vite, Tailwind CSS, Papa Parse, SheetJS (xlsx, AGPL-3.0), Vitest.  
**Architecture:** Pure client-side. All parsing, analysis, and cleaning happen in the browser.

---

## Architecture Summary

```
src/
  assets/           # Static assets (logo, icons)
  components/       # Shared UI primitives (Button, Badge, Table, Pagination, Modal)
  features/
    cleaning/
      components/   # Feature-specific UI (UploadZone, DataPreview, IssuePanel, CleaningResults)
      lib/          # Pure business logic (parser, detector, cleaner, exporter)
      types.ts      # Shared TypeScript types for this feature
  layouts/          # AppLayout (sidebar + main area)
  pages/            # Route-level page components (OverviewPage, DataCleaningPage)
  data/             # sampleDataset.ts — built-in demo dataset
  App.tsx
  main.tsx
tests/              # Vitest unit tests for lib/ functions
plans/              # This file
```

### Data flow

```
File upload
  → parser (Papa Parse / SheetJS)
  → ParsedDataset { columns, rows, fileName, sheetNames? }
  → detector (analyzeDataset)
  → DetectedIssue[]
  → User selects cleaning operations
  → cleaner (applyCleaningOperations)
  → CleaningResult { cleanedRows, changeSummary, changedCells }
  → Preview / download
```

### Key types (defined in `features/cleaning/types.ts`)

```ts
type CellValue = string | number | null;
type Row = Record<string, CellValue>;

interface ParsedDataset {
  fileName: string;
  columns: string[];
  rows: Row[];
  sheetNames?: string[];        // XLSX only
  activeSheet?: string;         // XLSX only
}

type IssueKind =
  | 'missing_values'
  | 'duplicate_rows'
  | 'whitespace'
  | 'numeric_as_text'
  | 'inconsistent_casing'
  | 'outliers';

interface DetectedIssue {
  kind: IssueKind;
  affectedCount: number;         // rows or cells
  affectedColumns: string[];
  explanation: string;
  example: string;
  availableActions: CleaningAction[];
}

type CapStyle = 'title' | 'upper' | 'lower';

interface CleaningAction {
  id: string;
  label: string;
  params?: {
    column?: string;
    fillStrategy?: 'median' | 'mean' | 'custom';
    customValue?: string;
    capStyle?: CapStyle;
  };
}

interface CleaningResult {
  cleanedRows: Row[];
  originalRowCount: number;
  finalRowCount: number;
  changeSummary: ChangeSummaryItem[];
  changedCells: Set<string>;     // "rowIndex:columnName" keys
}

interface ChangeSummaryItem {
  operation: string;
  count: number;
  description: string;
}
```

---

## Milestones

---

### Milestone 1 — Project Scaffold, Layout & File Upload

**Status:** `[x] done`

**Intent**
Bootstrap the Vite + React + TypeScript project, configure Tailwind CSS, install all required dependencies, build the application shell (sidebar, routing, two pages), and implement the complete file upload and data preview flow. These two concerns are combined because the layout and routing must exist before any feature UI can be verified, and verifying upload requires the page to exist.

**Expected Outcomes**
- `npm run dev` starts the app with no errors.
- Sidebar renders "Overview" and "Data Cleaning" navigation items with active-link highlighting.
- Overview page shows a welcome section, brief platform description, and a prominent "Start Cleaning Data" button that navigates to `/clean`.
- User can drag-and-drop or browse to upload a `.csv` or `.xlsx` file.
- Unsupported types and malformed files show clear inline error messages, not crashes.
- After valid upload: filename, row/column counts, and a paginated preview table (100 rows/page) are displayed.
- Preview table supports column sorting (click header to toggle asc/desc) and a global text filter input — both affect only the preview display, never the underlying `ParsedDataset`.
- For XLSX files: a sheet selector appears; switching sheets re-parses and updates the preview.
- The original `ParsedDataset` is stored immutably in state.
- `npm run test` runs (no tests yet, but Vitest is configured).
- `npm run build` produces a clean production build.

**Todo List**
1. Run `npm create vite@latest . -- --template react-ts` in the workspace root to scaffold the project (no overwrite of `.git` or `README.md`).
2. Install runtime dependencies: `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `papaparse`, `xlsx`, `@types/papaparse`.
3. Install dev dependencies: `vitest`, `@vitest/ui`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
4. Configure Tailwind CSS v4 via the Vite plugin (import in `src/index.css`).
5. Configure Vitest in `vite.config.ts` (environment: jsdom, setupFiles for jest-dom matchers).
6. Create the directory structure: `src/components/`, `src/features/cleaning/components/`, `src/features/cleaning/lib/`, `src/layouts/`, `src/pages/`, `src/data/`, `plans/`, `tests/`.
7. Build `AppLayout` component: fixed left sidebar (220 px) with app name/logo, nav items, and a main content `<Outlet />`. Sidebar collapses or stacks on small viewports.
8. Build `OverviewPage` (`src/pages/OverviewPage.tsx`):
   - Welcome heading and one-paragraph description of Datasphere.
   - A prominent "Start Cleaning Data" button that navigates to `/clean`.
   - No marketing copy, no placeholder cards.
9. Create stub `DataCleaningPage` (`src/pages/DataCleaningPage.tsx`).
10. Set up `react-router-dom` routes in `App.tsx`: `/` to `OverviewPage`, `/clean` to `DataCleaningPage`, nested inside `AppLayout`.
11. Define `ParsedDataset`, `Row`, and `CellValue` types in `src/features/cleaning/types.ts`.
12. Implement `src/features/cleaning/lib/parser.ts`:
    - `parseCSV(file: File): Promise<ParsedDataset>` using Papa Parse with `header: true`, `skipEmptyLines: true`, `dynamicTyping: false`.
    - `parseXLSX(file: File, sheetName?: string): Promise<ParsedDataset>` using SheetJS — read the workbook, extract the target sheet, normalize to named columns.
    - `parseFile(file: File, sheetName?: string): Promise<ParsedDataset>` — dispatches by file extension.
    - Validation: reject non-`.csv`/`.xlsx` files; reject files with 0 data rows or 0 columns.
13. Build `UploadZone` component (`src/features/cleaning/components/UploadZone.tsx`):
    - Drag-and-drop area using native HTML drag events.
    - "Browse file" fallback button.
    - Accepts `.csv, .xlsx` only (via `accept` attribute and runtime check).
    - Shows file name and size after selection.
    - Loading state while parsing; error state with inline message.
    - "Try Sample Dataset" button (stub — wired in Milestone 6).
14. Build `DataPreview` component (`src/features/cleaning/components/DataPreview.tsx`):
    - Horizontally scrollable table from `ParsedDataset`.
    - Pagination: previous/next page, page indicator, 100 rows per page.
    - Row and column counts above the table.
    - **Global filter input:** a text input above the table; filters displayed rows to those where any cell contains the search string (case-insensitive). Resets to page 1 on filter change. Does not alter `ParsedDataset`.
    - **Column sorting:** clicking a column header toggles sort direction (asc to desc to none); a sort indicator icon is shown. Applies to displayed rows only. Does not alter `ParsedDataset`.
    - For XLSX: a `SheetSelector` dropdown; changing sheet calls `parseXLSX` and updates the dataset.
15. Wire upload and preview together in `DataCleaningPage`.
16. Verify `npm run dev`, `npm run build`, and `npm run test` all pass.

**Relevant Context**
- `dynamicTyping: false` in Papa Parse keeps values as raw strings — required so the detector can later find "numeric as text" issues.
- SheetJS: use `XLSX.read(buffer, { type: 'array' })` for browser file reading.
- Sort and filter state lives in `DataPreview` local state; it is never stored in `ParsedDataset` and never passed to the cleaner.
- Original `ParsedDataset` rows must not be mutated. Store it once and pass it read-only to all downstream components.

**Acceptance Criteria**
- App loads at `/` showing the Overview page; "Start Cleaning Data" button navigates to `/clean`.
- Upload a 500-row CSV; preview paginates correctly across 5 pages.
- Typing a search term filters rows in the preview; clearing it restores all rows.
- Clicking a column header sorts the preview; clicking again reverses; clicking a third time removes the sort. Underlying data is unaffected.
- Upload a multi-sheet XLSX; sheet selector appears and switching sheets updates the preview.
- Upload a `.txt` file; inline error message shown, no crash.
- Upload a CSV with only a header row; error "No data rows found" shown.
- Upload a completely empty file; graceful inline error shown.
- Layout renders correctly at 768 px, 1024 px, and 1280 px viewport widths.
- Build output contains no TypeScript errors.

---

### Milestone 3 — Data Quality Detection

**Status:** `[x] done`

**Intent**  
Implement the `analyzeDataset` function that inspects a `ParsedDataset` and returns a typed array of `DetectedIssue` objects. This is the analytical core of the feature.

**Expected Outcomes**
- Running `analyzeDataset` on the sample dataset returns issues for all six categories.
- Issue objects include accurate `affectedCount`, at least one `example`, and correct `availableActions`.
- Outlier detection correctly uses the IQR method and only flags, never removes.
- No hardcoded counts — all counts are computed from the actual data.
- The `IssuePanel` component renders each issue in a readable card.

**Todo List**
1. Define remaining types in `types.ts`: `IssueKind`, `DetectedIssue`, `CleaningAction`, `CapStyle`.
2. Implement `src/features/cleaning/lib/detector.ts` — `analyzeDataset(dataset: ParsedDataset): DetectedIssue[]`:

   **Missing values** (`missing_values`)  
   - Count cells where value is `null`, `undefined`, or the trimmed string is `""`.
   - Group by column; report total affected cells and affected columns.
   - `availableActions`: fill with median, fill with mean, fill with custom value, leave unchanged.

   **Exact duplicate rows** (`duplicate_rows`)  
   - Serialize each row to a canonical JSON string; count rows where the string has been seen before.
   - Report the count of duplicate rows (rows that would be removed).
   - `availableActions`: remove duplicates.

   **Leading/trailing whitespace** (`whitespace`)  
   - Count string cells where `value !== value.trim()`.
   - `availableActions`: trim all string values.

   **Numeric as text** (`numeric_as_text`)  
   - For each string cell, attempt `Number(value.trim())`. Flag if: result is a finite number, the original string is not empty, the trimmed string does not have leading zeros (guard: `/^0\d/` pattern), and the trimmed string is not a pure integer that could be an ID/zip code (heuristic: flag only if the column contains >50% such values).
   - `availableActions`: convert to number.

   **Inconsistent casing** (`inconsistent_casing`)  
   - For each column where >80% of non-null values are strings, collect the unique lowercased values. If the same lowercased value appears in multiple casing variants, the column has inconsistent casing.
   - Report affected columns.
   - `availableActions`: standardize casing (per-column, with capStyle param).

   **Outliers** (`outliers`)  
   - For each numeric column (column where >80% of non-null values parse as finite numbers), compute Q1, Q3, IQR. Flag values outside `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.
   - Report count of outlier cells and affected columns.
   - `availableActions`: none — outliers are flagged only.

3. Build `IssuePanel` component (`src/features/cleaning/components/IssuePanel.tsx`):
   - Renders a card per `DetectedIssue`.
   - Each card shows: issue category icon/badge, affected count, explanation, example value, and available cleaning action controls (see Milestone 4 for action controls).
   - If no issues detected, shows a "No issues found" success state.
4. Write Vitest unit tests in `tests/detector.test.ts` covering each detection type with a small fixture dataset.

**Relevant Context**
- IQR outlier formula: `Q1 = 25th percentile`, `Q3 = 75th percentile`, `IQR = Q3 - Q1`, outlier bounds: `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.
- The "numeric as text" check must guard against IDs with leading zeros (e.g. zip codes like `"01234"`).
- The "inconsistent casing" check must only target text columns, not columns that are mixed or already purely numeric.

**Acceptance Criteria**
- All six detectors return correct results on the built-in sample dataset.
- Duplicate detection: a dataset with 3 identical rows reports 2 duplicates (rows that would be removed).
- Outlier detection on `[1, 2, 3, 4, 100]` flags `100` as an outlier.
- Whitespace detector does not flag already-trimmed values.
- Numeric-as-text detector does not flag `"01234"` (leading zero).
- All detector tests pass with `npm run test`.

---

### Milestone 4 — Cleaning Controls UI

**Status:** `[x] done`

**Intent**  
Build the interactive controls in `IssuePanel` that let users configure and select which cleaning operations to apply. This milestone is UI only — no cleaning logic runs yet.

**Expected Outcomes**
- Each issue card in `IssuePanel` shows its action controls.
- Users can select/deselect individual cleaning operations.
- For "fill missing values": a dropdown lets the user choose median, mean, or custom; a text input appears for custom value.
- For "standardize capitalization": a per-column dropdown (Title Case / UPPERCASE / lowercase) appears.
- A "Clean Dataset" primary button is shown below the panel; it is disabled if no actions are selected.
- The selected actions are collected into a `SelectedOperation[]` structure passed up to the page.

**Todo List**
1. Define `SelectedOperation` type (wraps `CleaningAction` with an `enabled: boolean`).
2. Add action control sub-components inside `IssuePanel`:
   - Checkbox or toggle per available action.
   - Conditional `<select>` for fill strategy when missing-value action is selected.
   - Conditional text `<input>` for custom fill value.
   - Per-column `<select>` for cap style on the inconsistent-casing action.
3. Manage selected operations in state within `DataCleaningPage`; `IssuePanel` calls `onOperationsChange` callback.
4. Add "Clean Dataset" `<Button>` below `IssuePanel`; disabled state when no operations are selected.
5. Add "Reset" link/button that clears the cleaning state and returns to the upload view.

**Relevant Context**
- Keep cleaning action state in `DataCleaningPage` (lifted state), not inside `IssuePanel`, so the page can pass it to the cleaner.
- The "Clean Dataset" button triggers the cleaner in Milestone 5.

**Acceptance Criteria**
- Selecting a "fill missing" action and choosing "custom" reveals the custom value input.
- Selecting "standardize capitalization" reveals a per-column dropdown for each affected column.
- "Clean Dataset" button is disabled until at least one operation is checked.
- De-selecting all checked operations re-disables the button.

---

### Milestone 5 — Cleaning Engine & Results

**Status:** `[x] done`

**Intent**  
Implement the `applyCleaningOperations` function that takes the original dataset and selected operations, applies them in a deterministic order, and returns a `CleaningResult`. Then build the results panel showing summary, before/after comparison, and highlighted changes.

**Expected Outcomes**
- Clicking "Clean Dataset" applies only the selected operations to a copy of the original data.
- Original data is never mutated.
- `CleaningResult` contains the correct `cleanedRows`, `changeSummary`, `changedCells`, and row counts.
- Results panel shows: change summary list, original vs. cleaned row counts, before/after data tables with changed cells highlighted.
- "Reset" returns to the upload step.

**Todo List**
1. Implement `src/features/cleaning/lib/cleaner.ts` — `applyCleaningOperations(dataset: ParsedDataset, operations: SelectedOperation[]): CleaningResult`:

   Apply operations in this fixed order to avoid conflicts:
   1. Remove exact duplicates — filter rows whose canonical JSON has been seen.
   2. Trim whitespace — iterate all string cells, apply `.trim()`.
   3. Convert numeric text — for flagged cells, convert `String → Number`.
   4. Fill missing values — per-column strategy (median / mean / custom).
   5. Standardize capitalization — per-column, apply chosen `capStyle`.

   Track every changed cell in `changedCells: Set<string>` using `"rowIndex:columnName"` keys.  
   Build `changeSummary` from operation counts.  
   Deep-clone `dataset.rows` at the start; never touch `dataset.rows` directly.

2. Build `CleaningResults` component (`src/features/cleaning/components/CleaningResults.tsx`):
   - Summary section: list of `ChangeSummaryItem` (operation name + count).
   - Original row count → Final row count with a delta indicator.
   - Two paginated tables side by side (or stacked on mobile): "Before" and "After".
   - In the "After" table, changed cells are highlighted (light yellow or blue tint background).
   - "Reset" button that clears all state.

3. Wire `DataCleaningPage` to call `applyCleaningOperations` on button click and render `CleaningResults` when a result exists.
4. Write Vitest unit tests in `tests/cleaner.test.ts` for each operation and their combination, including edge cases (empty column, all-null column, duplicate + trim interaction).

**Relevant Context**
- Median computation for fill: sort non-null numeric values, take the middle value (or average of two middle values for even-length arrays).
- Mean computation: sum of non-null numeric values divided by their count.
- Capitalization: Title Case = `str.replace(/\b\w/g, c => c.toUpperCase())`, UPPER = `.toUpperCase()`, lower = `.toLowerCase()`.
- Changed-cell highlighting uses the `changedCells` Set — look up `"rowIndex:columnName"` when rendering each table cell.

**Acceptance Criteria**
- Applying "remove duplicates" to a dataset with 3 identical rows reduces row count by 2.
- Applying "trim whitespace" to `"  hello  "` produces `"hello"` and marks the cell as changed.
- Applying "fill missing (median)" on a numeric column with one null fills it with the correct median.
- Applying "convert numeric text" on `"42.5"` produces the number `42.5`.
- Changed cells are visually highlighted in the after-table.
- Original dataset state is unchanged after cleaning.
- All cleaner tests pass with `npm run test`.

---

### Milestone 6 — Export & Sample Dataset

**Status:** `[x] done`

**Intent**  
Implement CSV and XLSX download of the cleaned dataset, and add the built-in sample dataset with a "Try Sample Dataset" button.

**Expected Outcomes**
- Clicking "Download as CSV" triggers a browser download of the cleaned data as a `.csv` file.
- Clicking "Download as XLSX" triggers a browser download as a `.xlsx` file.
- Column order is preserved exactly.
- A limitation notice is shown: exported XLSX contains only the cleaned sheet; original formatting and other worksheets are not preserved.
- "Try Sample Dataset" on the upload zone loads the built-in dataset without requiring a file upload.
- The sample dataset contains all six issue types (missing, duplicates, whitespace, numeric-as-text, inconsistent casing, outlier).

**Todo List**
1. Implement `src/features/cleaning/lib/exporter.ts`:
   - `exportAsCSV(result: CleaningResult, columns: string[], fileName: string): void` — use Papa Parse `unparse` to serialize, create a Blob, trigger `URL.createObjectURL` download.
   - `exportAsXLSX(result: CleaningResult, columns: string[], fileName: string): void` — use SheetJS `XLSX.utils.json_to_sheet`, then `XLSX.utils.book_append_sheet`, then `XLSX.writeFile` with `bookType: 'xlsx'`.
2. Add download buttons to `CleaningResults` component (CSV and XLSX).
3. Add a limitation notice below the XLSX download button: "Exported XLSX contains only the cleaned data sheet. Original formatting and additional worksheets are not preserved."
4. Create `src/data/sampleDataset.ts` — a hardcoded `ParsedDataset` with ~30 rows that includes:
   - 2–3 duplicate rows.
   - 2–3 rows with missing values in a numeric column.
   - 3–4 cells with leading/trailing whitespace.
   - 1 column with inconsistent capitalization (e.g. "New York", "new york", "NEW YORK").
   - 1 column with numeric-as-text values (e.g. `"29"`, `"34"`).
   - 1 clear numeric outlier detectable by IQR (e.g. `9999` in a column of values between 20–50).
5. Wire "Try Sample Dataset" button in `UploadZone` to load `sampleDataset` directly into page state, skipping the parser.

**Relevant Context**
- SheetJS `XLSX.writeFile` works in the browser and triggers download directly.
- Papa Parse `unparse` accepts an array of objects with a `fields` option to enforce column order.
- The sample dataset file name should be shown as `"sample_dataset.csv"` for display purposes.

**Acceptance Criteria**
- Download a cleaned CSV; open in Excel/Google Sheets; all values and column order are correct.
- Download a cleaned XLSX; file opens without errors in Excel.
- XLSX limitation notice is visible in the UI.
- Clicking "Try Sample Dataset" loads and displays the sample data preview with correct row/column counts.
- Running the detector on the sample dataset returns all six issue types.

---

### Milestone 7 — Polish, Error States & Testing

**Status:** `[x] done`

**Intent**
Complete the UI polish pass, implement all empty/loading/error states, write remaining unit and component tests, and ensure the application is production-ready within its defined scope.

**Expected Outcomes**
- All defined states (empty, loading, error, success) are handled with appropriate UI.
- No buttons exist that do nothing.
- No fake/hardcoded data anywhere.
- Application is visually consistent and respects the design requirements.
- All Vitest unit tests and component tests pass.
- Production build has no TypeScript errors or lint warnings.

**Todo List**
1. UI states audit — walk through every component and verify:
   - Empty state: upload zone before any file (clear CTA).
   - Loading state: spinner or skeleton while parsing (especially for large XLSX).
   - Error state: upload errors, parse errors — shown inline, not as alerts.
   - Success state: clean summary with green accent.
2. Responsive layout check: test sidebar + main area at 1280px, 1024px, and 768px viewport widths. Adjust Tailwind breakpoints as needed.
3. Typography and spacing pass: consistent heading hierarchy (h1/h2/h3), consistent spacing tokens via Tailwind.
4. Accessibility basics: all interactive elements have accessible labels; focus rings are visible; color contrast meets WCAG AA for text.
5. Write `tests/exporter.test.ts`: verify CSV output string matches expected structure for a small fixture dataset.
6. Write component tests in `tests/components/`:
   - `UploadZone.test.tsx` — test file acceptance, rejection of unsupported types, and error message display.
   - `DataPreview.test.tsx` — test that sort and filter affect only displayed rows and that pagination renders the correct page.
   - `IssuePanel.test.tsx` — test that selecting a "fill missing" action reveals the fill strategy dropdown, and that the "Clean Dataset" button is disabled when no actions are selected.
   - `CleaningResults.test.tsx` — test that the summary section shows correct operation counts, and that download buttons are present after a cleaning result is provided.
7. Review all tests; ensure `npm run test` passes with no failures and no skipped tests.
8. Run `npm run build`; fix any TypeScript errors or unused import warnings.
9. Update `README.md` with: project description, tech stack, local dev instructions (`npm install`, `npm run dev`, `npm run test`, `npm run build`), and a note about the SheetJS AGPL-3.0 license.

**Acceptance Criteria**
- `npm run test` — all tests pass, 0 failures, including both unit and component tests.
- `npm run build` — exits 0, no TypeScript errors.
- Uploading a 1 MB CSV file shows a loading state before the preview appears.
- Error uploading a `.pdf` file shows a friendly error message.
- Overview page loads with a working "Start Cleaning Data" button that navigates to `/clean`.
- Application renders correctly at 768px, 1024px, and 1280px viewport widths.

---

## Dependency List

| Package | Version | License | Purpose |
|---|---|---|---|
| react | ^19 | MIT | UI framework |
| react-dom | ^19 | MIT | DOM rendering |
| react-router-dom | ^7 | MIT | Client-side routing |
| typescript | ^5 | Apache-2.0 | Type safety |
| vite | ^6 | MIT | Build tool |
| @vitejs/plugin-react | ^4 | MIT | Vite React plugin |
| tailwindcss | ^4 | MIT | Utility CSS |
| @tailwindcss/vite | ^4 | MIT | Tailwind Vite plugin |
| papaparse | ^5 | MIT | CSV parsing and serialization |
| @types/papaparse | ^5 | MIT | PapaParse TypeScript types |
| xlsx | ^0.18 | AGPL-3.0 | XLSX read/write |
| vitest | ^3 | MIT | Unit testing |
| @vitest/ui | ^3 | MIT | Vitest browser UI |
| @testing-library/react | ^16 | MIT | Component testing utilities |
| @testing-library/jest-dom | ^6 | MIT | Custom DOM matchers |
| jsdom | ^26 | MIT | DOM environment for tests |

> **License note:** SheetJS (`xlsx`) is AGPL-3.0. Any application distributing this code must comply with AGPL-3.0 terms. This was an accepted trade-off for the IBM Challenge submission.

---

## Out of Scope for Version 1

- Backend, database, authentication, cloud storage.
- AI-assisted cleaning suggestions.
- Column deletion or renaming.
- Preview sort/filter that persists to or affects the exported file (preview interactions are display-only).
- Chart/visualization of data distributions.
- Support for file formats other than CSV and XLSX.
- Preserving Excel formulas, styles, or multiple sheets in export.
- Undo/redo history (beyond the reset button).
- User accounts or saving sessions.
