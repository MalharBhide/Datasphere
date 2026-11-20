/**
 * chartConfigValidator.ts
 *
 * Validates that a ChartConfig has all required fields properly set
 * before attempting to render an ECharts option.
 */
import type { ChartConfig, ColumnMeta, ValidationResult } from '../types'
import { CHART_REGISTRY } from '../types'

export function validateChartConfig(
  config: ChartConfig,
  columnMetas: ColumnMeta[],
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!config.chartType) {
    return { valid: false, errors: ['No chart type selected.'], warnings }
  }

  const registry = CHART_REGISTRY[config.chartType]
  if (!registry) {
    return { valid: false, errors: [`Unknown chart type: ${config.chartType}`], warnings }
  }

  const colMap = new Map(columnMetas.map((c) => [c.name, c]))
  const mapping = config.fieldMapping

  // Check required roles
  for (const role of registry.requiredRoles) {
    if (role === 'measures') {
      const measures = mapping.measures ?? []
      if (measures.length === 0) {
        errors.push('At least one numeric measure column is required.')
      } else {
        const allowed = registry.roleTypeConstraints[role] ?? []
        for (const m of measures) {
          const meta = colMap.get(m)
          if (!meta) {
            errors.push(`Column "${m}" does not exist in the dataset.`)
          } else if (allowed.length > 0 && !allowed.includes(meta.type)) {
            errors.push(`Column "${m}" must be one of: ${allowed.join(', ')} (found: ${meta.type}).`)
          }
        }
      }
      continue
    }

    const colName = (mapping as Record<string, string | string[] | undefined>)[role] as string | undefined
    if (!colName) {
      errors.push(`${roleName(role)} is required for a ${registry.displayName} chart.`)
      continue
    }

    const meta = colMap.get(colName)
    if (!meta) {
      errors.push(`Column "${colName}" does not exist in the dataset.`)
      continue
    }

    const allowed = registry.roleTypeConstraints[role] ?? []
    if (allowed.length > 0 && !allowed.includes(meta.type)) {
      errors.push(
        `${roleName(role)} "${colName}" must be ${allowed.join(' or ')} (found: ${meta.type}).`,
      )
    }
  }

  // Check optional roles that ARE specified
  for (const role of registry.optionalRoles) {
    if (role === 'measures') continue
    const colName = (mapping as Record<string, string | string[] | undefined>)[role] as string | undefined
    if (!colName) continue

    const meta = colMap.get(colName)
    if (!meta) {
      errors.push(`Column "${colName}" does not exist in the dataset.`)
      continue
    }

    const allowed = registry.roleTypeConstraints[role] ?? []
    if (allowed.length > 0 && !allowed.includes(meta.type)) {
      warnings.push(
        `${roleName(role)} "${colName}" is typically ${allowed.join(' or ')} but found: ${meta.type}.`,
      )
    }
  }

  // Chart-type-specific checks
  if (config.chartType === 'heatmap-correlation') {
    const measures = mapping.measures ?? columnMetas.filter((c) => c.type === 'numeric').map((c) => c.name)
    if (measures.length < 2) {
      errors.push('Correlation heatmap requires at least 2 numeric columns.')
    }
  }

  if (config.chartType === 'faceted') {
    const facetMeta = mapping.facetBy ? colMap.get(mapping.facetBy) : undefined
    if (facetMeta) {
      const uniqueCount = facetMeta.uniqueValues.length
      if (uniqueCount > 12) {
        warnings.push(
          `"${mapping.facetBy}" has ${uniqueCount} unique values. Only the first 12 panels will be shown.`,
        )
      }
    }
  }

  if (config.customization.yAxisScale === 'log') {
    warnings.push('Logarithmic scale requires all Y-axis values to be greater than zero.')
  }

  return { valid: errors.length === 0, errors, warnings }
}

function roleName(role: string): string {
  const names: Record<string, string> = {
    xAxis: 'X Axis',
    yAxis: 'Y Axis',
    category: 'Category',
    value: 'Value',
    series: 'Series/Group By',
    colorGroup: 'Color Group',
    measures: 'Measures',
    barSeries: 'Bar Series',
    lineSeries: 'Line Series',
    facetBy: 'Facet By',
  }
  return names[role] ?? role
}
