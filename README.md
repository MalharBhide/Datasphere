# Datasphere

A browser-based data workspace for inspecting and cleaning datasets. Upload a CSV or Excel file, detect quality issues, apply targeted cleaning operations, and download the corrected file — all without leaving your browser. No data ever leaves your machine.

## Features

- **Upload CSV or XLSX files** via drag-and-drop or file browser
- **Dataset preview** with sortable columns and global text filter
- **Automatic issue detection** for 6 data quality categories:
  - Missing / empty values
  - Exact duplicate rows
  - Leading / trailing whitespace
  - Numeric values stored as text
  - Inconsistent capitalization in text columns
  - Numeric outliers (IQR method, flagged only)
- **Selectable cleaning operations** with configurable parameters
- **Before / after comparison** with highlighted changed cells
- **Download cleaned files** as CSV or XLSX
- **Built-in sample dataset** to try the tool instantly

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 6 | Build tool |
| Tailwind CSS | 4 | Utility-first styling |
| React Router | 7 | Client-side routing |
| Papa Parse | 5 | CSV parsing and serialization |
| SheetJS (xlsx) | 0.18 | XLSX reading and writing |
| Vitest | 3 | Unit and component testing |
| Testing Library | 16 | Component test utilities |

## License Note

This project uses [SheetJS (xlsx)](https://sheetjs.com/) which is licensed under **AGPL-3.0**. Any distribution of this application must comply with AGPL-3.0 terms.

## Local Development

### Prerequisites

- Node.js 20 or later
- npm 10 or later

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**.

### Testing

```bash
# Run all tests once
npm run test

# Watch mode
npm run test:watch
```

### Production Build

```bash
npm run build
```

The build output is placed in `dist/`. Preview it locally with `npm run preview`.

## Project Structure

```
src/
  components/          # Shared UI primitives (Button, Badge, Pagination)
  features/
    cleaning/
      components/      # Feature UI (UploadZone, DataPreview, IssuePanel, CleaningResults)
      lib/             # Pure business logic (parser, detector, cleaner, exporter)
      types.ts         # TypeScript types for the cleaning feature
  layouts/             # AppLayout with sidebar navigation
  pages/               # Route-level page components
  data/                # Built-in sample dataset
tests/
  components/          # Component-level tests
  *.test.ts            # Unit tests for lib functions
plans/                 # Implementation plan documentation
```

## IBM Challenge

This project was built as part of the IBM Challenge submission. Version 1 focuses exclusively on client-side data cleaning with no backend, authentication, or cloud storage requirements.
