# Datasphere — Data Visualization Feature Plan

## Top-Level Overview

**Goal:** Add a full-featured, user-controlled Data Visualization platform to the existing Datasphere application as a first-class sibling to the existing Data Cleaning feature.

**Scope:** New sidebar nav item → `/visualize` route → dedicated page with a strict step-based wizard (matching the Data Cleaning style): upload dataset → pick chart type → configure mapping + aggregation + filters + statistics → customize appearance + live preview → export. Fourteen chart types rendered by Apache ECharts. Full statistical capabilities (descriptive stats, correlation, regression, distribution). No feature of the existing Data Cleaning module is modified.

**Wizard Step Flow:**
1. **Upload** — Upload a new CSV/XLSX or receive a dataset from the Data Cleaning session.
2. **Chart Type** — Select one of 14 chart types from a grid of cards.
3. **Configure** — Map fields (X/Y/series/category/color), set aggregation method, apply filters and sorting. For statistical chart types (histogram, scatter, box plot, correlation heatmap), a Statistics panel appears inline in this step showing descriptive stats, regression controls, and bin settings.
4. **Customize** — Set titles, axis labels, colors, scale, legend, and see a live preview update in real time.
5. **Preview & Export** — Full-screen chart preview with PNG and SVG download buttons. Stats summary shown beneath the chart.

**Approach (6 Milestones):**
- Milestone 1 — Dataset integration & navigation wiring
- Milestone 2 — Chart type registry + manual chart builder (data mapping)
- Milestone 3 — Aggregation, filtering, sorting, and chart customization panel
- Milestone 4 — Statistical visualizations (histograms, box plots, correlation, regression)
- Milestone 5 — Chart export (PNG + SVG)
- Milestone 6 — Comprehensive automated tests + final QA

Each milestone leaves the app in a fully working, deployable state before the next begins.

**Key constraints:**
- Users manually choose every aspect of their visualization — no auto-generated charts.
- Apache ECharts (`echarts`) is the rendering engine.
- Step-based wizard UI exactly mirrors the Data Cleaning workflow style (step indicator, full-width cards, same transitions).
- All CSS colors from `--ds-*` variables; no hardcoded hex values in component files.
- All new nav, routes, contexts, components, and lib modules follow the same patterns as the existing cleaning feature.
- Do not modify `src/features/cleaning/lib/` or any existing test.
- Run `npm run test && npm run build` after each milestone.

---

## Architecture Overview

```
src/
  features/
    visualization/
      types.ts                    # All TS types: ChartConfig, FieldMapping, AggregationConfig, ...
      lib/
        fieldDetector.ts          # Infer column types (numeric / categorical / date / boolean)
        aggregator.ts             # Sum, mean, median, count, min, max, stddev, variance
        transformer.ts            # Group-by, filter, sort, bin (histogram), date parsing
        statsCalculator.ts        # Descriptive stats, Pearson correlation, linear regression
        chartConfigValidator.ts   # Validate mapping completeness per chart type; return errors
        echartsBuilder.ts         # Convert ChartConfig → ECharts option object
        chartExporter.ts          # ECharts instance → PNG/SVG blob → download
      components/
        DatasetUpload.tsx         # Reuses parser.ts; dataset selection from cleaning session
        ChartTypeSelector.tsx     # Grid of 14 chart type cards
        FieldMappingPanel.tsx     # Dynamic axis/series/category pickers per chart type
        AggregationPanel.tsx      # Aggregation method + group-by + filter + sort controls
        StatisticsPanel.tsx       # Inline stats for step 3 (histogram, scatter, box plot, heatmap)
        CustomizationPanel.tsx    # Titles, axis labels, colors, scale, legend, tooltips (step 4)
        ChartPreview.tsx          # ECharts wrapper — used in step 4 and step 5
        ExportPanel.tsx           # PNG/SVG download buttons (step 5)
  contexts/
    VisualizationContext.tsx      # Session state (mirrors CleaningSessionContext pattern)
  pages/
    DataVisualizationPage.tsx     # Orchestrates the 5-step wizard
```

**New dependencies to install:**
- `echarts` — chart rendering engine
- `echarts-for-react` (or direct DOM ref approach) — React integration

**Files touched in existing code:**
- `src/App.tsx` — add `<Route path="/visualize" element={<DataVisualizationPage />} />`
- `src/layouts/AppLayout.tsx` — add "Data Visualization" nav item with chart icon
- `src/pages/OverviewPage.tsx` — update hero copy / feature grid for the new feature

---

## Sub-Tasks

---

### Milestone 1 — Dataset Integration & Navigation

**Status:** [ ] pending

**Intent:** Wire the new feature into the existing app shell, install ECharts, create the visualization session context, build the dataset-loading step, and establish the full feature folder structure. After this milestone, navigating to `/visualize` shows a working upload step where users can upload a CSV/XLSX or receive a dataset sent from the Data Cleaning workflow.

**Expected Outcomes:**
- "Data Visualization" appears in the sidebar and mobile nav, navigates to `/visualize`.
- `/visualize` renders a page with a dataset upload/selection step.
- Users can upload a new CSV or XLSX directly into the visualization feature (reuses `parseFile` from `src/features/cleaning/lib/parser.ts`).
- When a cleaned dataset exists in the cleaning session, a "Use cleaned dataset" option is offered.
- `VisualizationContext` holds visualization session state (dataset, chartConfig, step).
- `src/features/visualization/types.ts` defines all TypeScript interfaces.
- `fieldDetector.ts` correctly classifies each column as `numeric | categorical | date | boolean`.
- `npm run test && npm run build` pass.

**Todo List:**
1. Install `echarts` and `echarts-for-react` via npm (update package.json).
2. Create `src/features/visualization/types.ts` — define `VisualizationStep`, `ChartType`, `FieldType`, `ColumnMeta`, `FieldMapping`, `AggregationConfig`, `FilterRule`, `SortRule`, `ChartCustomization`, `ChartConfig`, `VisualizationSession`.
3. Create `src/features/visualization/lib/fieldDetector.ts` — `detectColumnTypes(dataset: ParsedDataset): ColumnMeta[]`. Rules: >80% parseable as number → `numeric`; ISO date pattern → `date`; otherwise `categorical`. Boolean detection: only two unique non-null values that are "true/false/yes/no/1/0".
4. Create `src/contexts/VisualizationContext.tsx` — mirrors `CleaningSessionContext` pattern. State: `{ step, dataset, columnMetas, chartConfig, isLoading, error }`. Provide `setSession`, `resetSession`.
5. Add `<VisualizationSessionProvider>` wrapper in `src/App.tsx`.
6. Add `/visualize` route in `src/App.tsx` pointing to `DataVisualizationPage` (file not yet fully built — just a placeholder page returning a `<div>`).
7. Add "Data Visualization" nav item to `src/layouts/AppLayout.tsx` sidebar and mobile nav. Use an SVG chart icon consistent with the existing nav style. Active highlight uses `--ds-sidebar-active`.
8. Create `src/features/visualization/components/DatasetUpload.tsx` — renders the upload step. Reuses `UploadZone` component or builds a similar one. Offers two paths: (a) upload new file (calls `parseFile`), (b) "Use data from Data Cleaning" if `CleaningSession.cleaningResult` exists (uses cleaned rows + original columns). On success, calls `fieldDetector` and transitions to chart type selection step.
9. Create `src/pages/DataVisualizationPage.tsx` — renders the multi-step workflow. Step 1 = `DatasetUpload`. Remaining steps are stubs showing "coming in next milestone" text. Uses `useVisualizationSession()`.
10. Update `src/pages/OverviewPage.tsx` — add Data Visualization to the feature grid description.
11. Run `npm run test && npm run build`.

**Relevant Context:**
- `src/features/cleaning/lib/parser.ts` — `parseFile(file, sheetName?)` — reuse directly, do not copy.
- `src/contexts/CleaningSessionContext.tsx` — exact pattern to replicate for visualization context.
- `src/layouts/AppLayout.tsx` — nav item structure: `<NavLink to="/clean" ...>` with inline SVG icon.
- `src/App.tsx` — route structure.
- `src/features/cleaning/types.ts` — `ParsedDataset`, `Row`, `CellValue` — import from here, do not redefine.
- `src/components/Button.tsx`, `src/components/Card.tsx` — reuse for upload step UI.

---

### Milestone 2 — Chart Type Registry & Manual Chart Builder

**Status:** [ ] pending

**Intent:** Implement the full chart type selector and the field-mapping panel. Each of the 14 chart types has explicit requirements for which field roles are needed (and optional). The ECharts builder converts a completed `ChartConfig` into a live ECharts option, and the `ChartPreview` component renders it. After this milestone, users can build any of the 14 chart types by manually mapping columns to axes, see a live preview, and receive clear validation errors for incomplete or invalid configurations. No aggregations yet — raw/grouped data only.

**Expected Outcomes:**
- Chart type selector shows all 14 types with icons and names, all functional.
- Selecting a chart type reveals only the relevant field-mapping controls for that type.
- Field pickers are filtered to valid column types per role (e.g., scatter X/Y only allows numeric columns).
- `chartConfigValidator.ts` returns specific error messages for every missing or mismatched field.
- `echartsBuilder.ts` produces a valid ECharts option for all 14 types when config is valid.
- `ChartPreview` renders the live ECharts chart in real time as the user changes mappings.
- No silent bad charts — invalid configurations show an inline error state, not a broken chart.
- `npm run test && npm run build` pass.

**Todo List:**
1. Define the **chart type registry** inside `types.ts` — a `CHART_REGISTRY` constant mapping each `ChartType` to: required roles, optional roles, allowed column types per role, display name, description, icon name. The 14 chart types are:
   - Standard: `bar-vertical`, `bar-horizontal`, `bar-grouped`, `bar-stacked`, `line`, `area`, `pie`
   - Statistical: `histogram`, `box-plot`, `heatmap-correlation`
   - Advanced: `combo-bar-line`, `line-multi-series`, `faceted`
2. Create `src/features/visualization/lib/chartConfigValidator.ts` — `validateChartConfig(config: ChartConfig, columnMetas: ColumnMeta[]): ValidationResult`. Returns `{ valid: boolean, errors: string[] }`. Validates: required roles are assigned, assigned columns exist in dataset, column types match role requirements, minimum data requirements.
3. Create `src/features/visualization/components/ChartTypeSelector.tsx` — grid of 14 cards (similar style to issue cards). Each card shows chart icon (SVG), name, and brief description. Click selects the type and advances step. No chart type is shown as "disabled" — all are implemented.
4. Create `src/features/visualization/components/FieldMappingPanel.tsx` — dynamically renders field pickers based on selected chart type's registry entry. Each role (X axis, Y axis, category, series, color group, measures) gets a labeled `<select>` populated with eligible column names. Shows `ValidationResult.errors` inline as a list when present.
5. Create `src/features/visualization/lib/echartsBuilder.ts` — `buildEChartsOption(config: ChartConfig, dataset: ParsedDataset, columnMetas: ColumnMeta[]): EChartsOption`. Implements the full ECharts option construction for all 14 chart types. Uses `--ds-primary` color family as default palette. Respects `ChartCustomization` where available (titles, axis labels, legend visibility).
   - `bar-vertical` / `bar-horizontal`: basic bar with optional series grouping
   - `bar-grouped` / `bar-stacked`: grouped/stacked series
   - `line` / `area`: line with optional fill
   - `pie`: pie/donut with category + value
   - `histogram`: bins data into N buckets, renders as bar
   - `box-plot`: computes Q1/Q2/Q3/min/max per category, uses ECharts boxplot series
   - `heatmap-correlation`: renders correlation matrix as ECharts heatmap
   - `combo-bar-line`: dual series, one bar + one line, with dual Y axis support
   - `line-multi-series`: multiple numeric columns as separate line series
   - `faceted`: renders multiple small sub-charts in a grid (one per category value)
6. Create `src/features/visualization/components/ChartPreview.tsx` — React component that wraps ECharts using `echarts-for-react`. Receives `EChartsOption`. Shows validation error state if config is invalid. Full responsive width, fixed height (480px default). Enable zoom + tooltip + legend toggle by default.
7. Update `DataVisualizationPage.tsx` — hook up chart type selector, field mapping panel, and chart preview as steps 2–3 in the workflow. Add "Back" buttons to navigate between steps.
8. Run `npm run test && npm run build`.

**Relevant Context:**
- ECharts docs: https://echarts.apache.org/en/api.html — EChartsOption type from `echarts/types/dist/echarts`.
- `src/features/visualization/types.ts` (from Milestone 1).
- `src/features/cleaning/types.ts` — `ParsedDataset` structure.
- `src/features/visualization/lib/fieldDetector.ts` — `ColumnMeta` classification.
- Design system: chart colors should use CSS variable values extracted at runtime (`getComputedStyle(document.documentElement).getPropertyValue('--ds-primary')`).

---

### Milestone 3 — Aggregation, Filtering, Sorting & Chart Customization

**Status:** [ ] pending

**Intent:** Add the data-transformation layer (aggregation, filtering, sorting, group-by) and the full chart customization panel. After this milestone, users can aggregate raw data before charting (e.g., bar chart of average salary by department), apply row filters, sort the data, and fully customize titles, axis labels, colors, scale type, and legend. All changes update the live preview immediately.

**Expected Outcomes:**
- `aggregator.ts` correctly computes sum, mean, median, count, min, max, stddev, variance.
- `transformer.ts` correctly applies group-by, filter, sort, date-range selection, missing-value exclusion.
- `AggregationPanel` offers aggregation method picker, group-by column selector, filter builder (column + operator + value), sort controls (column + direction).
- `CustomizationPanel` covers: chart title, subtitle, x/y axis labels, data labels toggle, legend (show/hide + position), color palette selector (5 built-in palettes + custom per-series), marker size, axis min/max, number format (plain / currency / percentage), date format, linear/logarithmic scale toggle.
- Invalid axis config (log scale on negative/zero values) shows a warning, not a broken chart.
- All customization values persist in `ChartConfig.customization` (serializable).
- `npm run test && npm run build` pass.

**Todo List:**
1. Create `src/features/visualization/lib/aggregator.ts` — `aggregate(rows: Row[], groupByCol: string, valueCol: string, method: AggregationMethod): AggregatedRow[]`. Methods: `sum | mean | median | count | min | max | stddev | variance`. Correctly skips null/non-numeric values. For `count`, counts all non-null values.
2. Create `src/features/visualization/lib/transformer.ts` — `transformDataset(dataset: ParsedDataset, config: TransformConfig): TransformedDataset`. Applies in order: (1) filter rows, (2) sort, (3) group-by + aggregate, (4) select/rename fields for chart roles. `TransformConfig` includes `filters: FilterRule[]`, `sortRules: SortRule[]`, `groupBy?: string`, `aggregation?: AggregationConfig`, `dateRange?: DateRangeFilter`, `excludeMissingValues: boolean`. Returns excluded-row count for display.
3. Update `echartsBuilder.ts` — consume `TransformedDataset` instead of raw `ParsedDataset`. Pass through `ChartCustomization` to ECharts: `title.text/subtext`, `xAxis.name/min/max`, `yAxis.name/min/max/type` (log vs value), `legend.show/orient/left/top`, `series[].label.show`, number formatter functions.
4. Create `src/features/visualization/components/AggregationPanel.tsx` — UI for aggregation method (dropdown), group-by column (select), filter builder (dynamic list of filter rows: column + operator + value), sort (column + asc/desc), date-range filter (start/end date inputs shown only if a date column is in use), missing-value handling toggle. Each control only shows when applicable to the chart type.
5. Create `src/features/visualization/components/CustomizationPanel.tsx` — Sections: "Titles & Labels", "Colors", "Axes", "Display". Use `Card` for each section. Color palette picker shows 5 preset palettes as swatch rows (Datasphere Indigo, Emerald, Warm, Cool, Monochrome). Series-level color overrides: one color swatch per detected series. Axis controls: min/max number inputs, format dropdown, scale type toggle, date format input.
6. Update `DataVisualizationPage.tsx` — wire up the Configure step (step 3) to show `FieldMappingPanel`, `AggregationPanel`, and `StatisticsPanel` (for statistical chart types). The Customize step (step 4) renders `CustomizationPanel` with a live `ChartPreview` beneath it. Step 5 renders the full-width `ChartPreview` and `ExportPanel`.
7. Run `npm run test && npm run build`.

**Relevant Context:**
- `src/features/visualization/lib/aggregator.ts` — must handle edge cases: empty groups, all-null columns, single-value groups (stddev = 0).
- `ChartConfig` from `types.ts` must include a `transform: TransformConfig` field — keep serializable (no functions in state).
- ECharts `yAxis.type: 'log'` requires all values > 0; validate before setting.
- Color palette constant can live in `types.ts` or a `palettes.ts` file.

---

### Milestone 4 — Statistical Visualizations & Calculations

**Status:** [ ] pending

**Intent:** Implement the statistical features that go beyond basic charting: descriptive statistics panel, Pearson correlation matrix + heatmap, linear regression trendlines on scatter plots, histogram bin adjustment, and box-plot outlier identification. All calculations must be mathematically accurate. No features are claimed unless fully implemented.

**Expected Outcomes:**
- `statsCalculator.ts` correctly computes: mean, median, mode, min, max, range, variance, stddev, Q1, Q3, IQR, percentiles, Pearson correlation.
- Descriptive statistics panel appears in a collapsible section when any numeric column is selected; shows the full stat table.
- Correlation heatmap chart type renders an accurate matrix; excludes columns with zero variance or insufficient data with a visible note.
- Scatter plot has optional "Add Regression Trendline" toggle; when on, renders ECharts `markLine` with the least-squares line, equation `y = mx + b`, and R² displayed in the chart.
- Histogram bin count is adjustable (slider: 5–100 bins); bin edges and counts are recalculated live.
- Box plots use Q1, Q2 (median), Q3, and IQR whiskers (1.5×IQR); outlier points rendered individually.
- Outlier count is shown in a badge; records are highlighted, not deleted.
- `npm run test && npm run build` pass.

**Todo List:**
1. Create `src/features/visualization/lib/statsCalculator.ts`. Exports:
   - `describeColumn(values: number[]): DescriptiveStats` — { mean, median, mode, min, max, range, variance, stddev, q1, q3, iqr, p5, p25, p75, p95, count, missingCount }
   - `pearsonCorrelation(x: number[], y: number[]): number | null` — returns null if constant or < 2 paired values
   - `correlationMatrix(dataset: ParsedDataset, columns: string[]): CorrelationMatrix`
   - `linearRegression(x: number[], y: number[]): { slope: number, intercept: number, rSquared: number } | null`
   - `computeBoxPlot(values: number[]): BoxPlotStats` — { min, q1, median, q3, max, outliers: number[] }
   - `histogramBins(values: number[], binCount: number): HistogramBin[]` — { start, end, count }
2. Create `src/features/visualization/components/StatisticsPanel.tsx` — collapsible card shown beneath the chart when numeric columns are present. Contains two tabs: "Descriptive Stats" (table with stat rows per selected column) and "Correlation" (triggers correlation matrix calculation + renders as heatmap). Shows included/excluded row count and reason.
3. Update `echartsBuilder.ts` for scatter regression:
   - When `ChartConfig.showRegressionLine === true` and chart type is `scatter`, compute regression via `linearRegression()`, add a `markLine` series rendering the fitted line from x_min to x_max.
   - Annotate chart subtitle or graphic element with equation `y = {m}x + {b}` and `R² = {r2}`.
4. Update `echartsBuilder.ts` for histogram:
   - Accept `binCount` from `ChartConfig`, delegate binning to `histogramBins()` in `statsCalculator.ts`, render as bar chart with bin edges as x-axis labels.
5. Update `echartsBuilder.ts` for box plot:
   - Accept grouped box-plot data (one box per category), call `computeBoxPlot()` per group, format data as `[[min, q1, median, q3, max], ...]` for ECharts `boxplot` series. Render outliers as `scatter` series overlay.
6. Add `binCount` control in `AggregationPanel` (shown only for `histogram` chart type): `<input type="range" min={5} max={100}>` with numeric display.
7. Add "Show Regression Line" toggle in `CustomizationPanel` (shown only for `scatter` chart type).
8. Run `npm run test && npm run build`.

**Relevant Context:**
- Pearson correlation formula: r = Σ(xi - x̄)(yi - ȳ) / sqrt(Σ(xi - x̄)² · Σ(yi - ȳ)²). Guard: if stddev of either = 0, return null.
- R² for linear regression: 1 - (SS_res / SS_tot).
- ECharts boxplot series data format: each item = `[min, Q1, median, Q3, max]`.
- Heatmap ECharts: use `visualMap` component with `--ds-primary` to `--ds-accent` color gradient.

---

### Milestone 5 — Chart Export

**Status:** [ ] pending

**Intent:** Allow users to download the currently displayed chart as a PNG or SVG file. The exported image must include the chart title, labels, legends, and all applied styling — matching exactly what is shown in the browser.

**Expected Outcomes:**
- "Export PNG" and "Export SVG" buttons appear in the chart preview area.
- PNG export produces a correctly sized, opaque (white background) image with all visible chart elements.
- SVG export produces a valid, standalone SVG file.
- Exported filenames follow `{chart-title or "chart"}_{timestamp}.png/svg` pattern.
- Export works for all 14 chart types.
- `npm run test && npm run build` pass.

**Todo List:**
1. Create `src/features/visualization/lib/chartExporter.ts`. Exports:
   - `exportChartAsPNG(echartsInstance: ECharts, filename: string): void` — calls `echartsInstance.getDataURL({ type: 'png', backgroundColor: '#fff', pixelRatio: 2 })`, creates `<a>` download link.
   - `exportChartAsSVG(echartsInstance: ECharts, filename: string): void` — calls `echartsInstance.getDataURL({ type: 'svg' })`, creates `<a>` download link.
2. Create `src/features/visualization/components/ExportPanel.tsx` — two `Button` components ("Download PNG" / "Download SVG") with chart/download SVG icons. Disabled when no chart is rendered. Calls exporter functions via ECharts ref passed down from `ChartPreview`.
3. Expose ECharts instance ref from `ChartPreview.tsx` using `useRef` + `echartsInstance` forwarded via `echarts-for-react`'s `ref` prop or `getEchartsInstance()` method.
4. Place `ExportPanel` below the `ChartPreview` component in `DataVisualizationPage`.
5. Run `npm run test && npm run build`.

**Relevant Context:**
- `echarts-for-react` exposes `getEchartsInstance()` on the component ref.
- ECharts `getDataURL({ type: 'png', pixelRatio: 2 })` returns a base64 data URL.
- For SVG: ECharts must be initialized with the SVG renderer (`{ renderer: 'svg' }`). Consider using the canvas renderer for general use and triggering a temporary SVG render only on export, or offer only SVG when renderer is `svg`. Simplest: use canvas renderer for display, generate a second off-screen ECharts instance with SVG renderer for SVG export using same option.

---

### Milestone 6 — Comprehensive Tests & Final QA

**Status:** [ ] pending

**Intent:** Write automated tests for all new lib modules. Verify the full application — all 14 chart types, statistical calculations, integration with Data Cleaning, all export paths, and edge cases — passes without breaking existing tests. Fix any bugs uncovered.

**Expected Outcomes:**
- All existing 64+ tests continue to pass.
- New tests cover: `fieldDetector`, `aggregator`, `transformer`, `statsCalculator`, `chartConfigValidator`, `echartsBuilder` (option structure), `chartExporter` (download trigger).
- Tests cover: all aggregation methods, all filter operators, sort asc/desc, date parsing, histogram bins, quartiles, box plot outliers, Pearson correlation (with constant column, with missing values), linear regression R², config validation for each chart type, dataset transfer from cleaning session.
- Edge cases tested: empty dataset, all-null column, single-row dataset, columns with duplicate names, very large dataset (1000+ rows, performance smoke test).
- `npm run test` passes (0 failures).
- `npm run build` exits 0 with no TypeScript errors.
- Local dev server starts and all workflows are manually verified as described in the requirements §11.

**Todo List:**
1. Create `tests/visualization/fieldDetector.test.ts` — tests for numeric, categorical, date, and boolean detection; edge cases: mixed column, all-null column, single-unique-value column.
2. Create `tests/visualization/aggregator.test.ts` — tests for all 7 aggregation methods; null handling; single-value groups; group ordering.
3. Create `tests/visualization/transformer.test.ts` — filter operators (`=`, `!=`, `>`, `<`, `contains`); sort asc/desc; group-by + aggregate pipeline; date-range filter; missing-value exclusion.
4. Create `tests/visualization/statsCalculator.test.ts` — mean/median/mode/stddev/variance; quartile correctness; Pearson with known r-value; regression with known slope + intercept + R²; histogram bin edges; box plot whisker calculation + outlier identification; correlation matrix with constant column returning null.
5. Create `tests/visualization/chartConfigValidator.test.ts` — valid configs pass; each required-field-missing scenario returns specific error; mismatched column types return error.
6. Create `tests/visualization/echartsBuilder.test.ts` — for each of the 14 chart types, verify that `buildEChartsOption()` returns an object with the expected ECharts series type, correct x/y axis structure, correct data format.
7. Smoke test for `chartExporter.ts` — mock `echartsInstance.getDataURL` and `document.createElement('a')`, verify correct filename is used and `click()` is called.
8. Run full test suite: `npm run test`.
9. Run build: `npm run build`.
10. Start dev server: `npm run dev` — manually verify all 14 chart types, statistical panels, cleaning-to-visualization transfer, PNG/SVG export.
11. Document any limitations in a `VISUALIZATION_LIMITATIONS.md` file at the project root.

**Relevant Context:**
- Existing test pattern: `tests/detector.test.ts` — `describe/it/expect` with inline dataset builders.
- `tests/cleaner.test.ts` — edge case pattern for null handling and regression tests.
- ECharts option structure can be tested without rendering — just check `option.series[0].type === 'bar'`.
- `chartExporter` uses browser APIs — use `vi.stubGlobal` for `document.createElement` or `URL.createObjectURL` mocking.

---

## Dependency Notes

Install before Milestone 2 begins:
```
npm install echarts echarts-for-react
npm install --save-dev @types/echarts
```
Note: `echarts` ships its own TypeScript types — `@types/echarts` may not be needed. Use `import type { EChartsOption } from 'echarts'`.

---

## Open Decisions / Assumptions

1. **React ECharts integration:** `echarts-for-react` is the standard wrapper. If it proves incompatible with React 19, use a direct `useEffect`/`useRef` DOM approach instead.
2. **Visualization step flow:** Strict 5-step wizard: Upload → Chart Type → Configure (fields + agg + filters + inline stats) → Customize (live preview) → Preview + Export. Users can navigate Back freely from step 2 onwards.
3. **Statistics placement:** Inline in the Configure step (step 3) for statistical chart types. A summary stats card is also shown below the chart on the Preview + Export step (step 5).
4. **No chart saving to disk:** `ChartConfig` is serializable in-memory and survives SPA navigation via context, but there is no server-side persistence. If the user refreshes, they start over.
5. **Faceted charts limitation:** Faceted rendering inside a single ECharts instance uses a grid array (one grid per category value). The number of panels is capped at 12 to avoid performance issues.
6. **SVG export approach:** Use a second off-screen ECharts SVG-renderer instance for SVG export to avoid changing the display renderer mid-session.
