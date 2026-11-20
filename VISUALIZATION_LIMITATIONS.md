# Datasphere — Data Visualization Feature Limitations

This document describes known limitations of the Data Visualization feature
as of the current release. All implemented features have been tested and verified.

---

## Working Features (Fully Implemented)

- **14 chart types**: Vertical Bar, Horizontal Bar, Grouped Bar, Stacked Bar, Line,
  Area, Pie, Scatter Plot, Histogram, Box Plot, Correlation Heatmap, Combo
  Chart, Multi-Series Line, Faceted Charts
- **Field mapping**: Column pickers filtered to valid types per chart role
- **Aggregation**: Sum, Mean, Median, Count, Min, Max, Std Dev, Variance
- **Filters**: 8 operators (eq, neq, gt, lt, gte, lte, contains, not_contains)
- **Sorting**: Ascending/descending by any column
- **Date range filtering**: ISO date and common date format support
- **Chart customization**: Titles, axis labels, color palettes, scale (linear/log),
  legend, data labels, marker size
- **Statistical panel**: Descriptive stats (mean, median, mode, stddev, variance,
  quartiles, percentiles) for selected numeric columns
- **Regression trendlines**: Linear regression on scatter plots with equation and R²
- **Histogram bins**: Adjustable bin count (5–100)
- **Box plot outlier identification**: IQR method, outliers shown as separate points
- **Correlation heatmap**: Pearson correlation matrix with exclusion of constant
  and low-data columns
- **PNG export**: 2× pixel ratio, white background
- **SVG export**: Off-screen ECharts SVG renderer
- **Dataset transfer from Data Cleaning**: "Use cleaned dataset" button when a
  cleaned dataset exists in the cleaning session
- **5-step wizard**: Matches Data Cleaning UI style throughout

---

## Known Limitations

### 1. Bundle Size
The ECharts library (~2 MB uncompressed) significantly increases the production
bundle size. Code splitting via dynamic imports was not applied in this release
because it would require restructuring the import model beyond the milestone scope.
**Mitigation:** Configure `build.rollupOptions.output.manualChunks` in `vite.config.ts`
to split ECharts into a separate chunk.

### 2. Faceted Charts — Maximum 12 Panels
Faceted charts cap the number of sub-panels at 12 unique category values. Additional
categories are silently ignored. A warning is shown in the validator when more than
12 unique values are detected. This prevents performance degradation on large
high-cardinality columns.

### 3. No Chart Persistence Across Hard Refresh
Chart configurations are stored in React context (in-memory). They survive SPA
navigation but are cleared on a full page reload. There is no localStorage or
server-side persistence in this release.

### 4. Aggregation Column Resolution
When aggregation is configured without explicitly specifying which column to
aggregate (e.g., in Grouped Bar or Stacked Bar charts), the transformer uses the
Y-axis field mapping as the value column. If the user does not set both a Group By
column and a Y-axis column, aggregation is silently skipped and raw data is used.
This is surfaced as a no-op (no error) but could confuse users who set aggregation
without field mapping.

### 5. SVG Export Requires ECharts Renderer Re-instantiation
SVG export creates a temporary off-screen ECharts instance with the SVG renderer
and disposes it after export. This adds ~100–300ms overhead on the first SVG export.
On some browsers, the SVG content may not capture custom fonts due to browser security
restrictions on cross-origin font embedding.

### 6. Multi-Sheet XLSX Not Supported in Visualization Upload
The Data Cleaning feature supports multi-sheet XLSX files with a sheet switcher.
The visualization upload currently reads only the first sheet. Sheet selection is
not surfaced in the visualization upload step.

### 7. Correlation Heatmap Label Density
On correlation matrices with more than 8 columns, data labels inside the heatmap
cells are hidden automatically to prevent overlap. The visualMap (color scale)
still shows the values on hover.

### 8. No Real-Time Collaborative Editing
Only one user at a time can interact with a session. The app is entirely client-side
with no WebSocket or server communication.

### 9. Date Parsing in Transformer
Dates are parsed using JavaScript's `new Date()`. Ambiguous formats (e.g., `01/02/2024`
could be January 2nd or February 1st depending on locale) are handled by the browser's
date parser, which may differ across environments. For reliable date filtering,
use unambiguous ISO 8601 format (`YYYY-MM-DD`).

### 10. Scatter Plot Regression Only for Ungrouped Data
When a color group is specified on a scatter plot, the regression trendline is
calculated on all data points combined (not per-group). Per-group regression
lines would require multiple regression computations and are not supported in
this release.

---

## Not Implemented (Out of Scope for This Release)

- Statistical hypothesis tests (t-test, ANOVA, chi-square)
- Choropleth or geographic maps
- 3D charts
- Animation or time-lapse playback
- Dashboard layout (multiple charts side by side)
- Chart templates or saved configurations
- Server-side rendering or SSR exports
