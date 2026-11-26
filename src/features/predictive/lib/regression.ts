/**
 * regression.ts
 *
 * Pure functions for simple linear regression in the Predictive Analytics feature.
 * Reuses ParsedDataset from cleaning/types and linearRegression from statsCalculator.
 */
import type { ParsedDataset, Row } from '../../cleaning/types'
import { linearRegression } from '../../visualization/lib/statsCalculator'

export interface RegressionInput {
  dataset: ParsedDataset
  xCol: string
  yCol: string
}

export interface RegressionResult {
  slope: number
  intercept: number
  rSquared: number | null   // null when Y is constant
  equation: string
  validRows: Row[]
  excludedCount: number
  xValues: number[]
  yValues: number[]
}

export interface RegressionError {
  kind:
    | 'same_column'
    | 'insufficient_data'
    | 'constant_x'
    | 'missing_column'
  message: string
}

/**
 * Prepare the working rows: filter to those where both xCol and yCol are
 * finite numbers. Never modifies the original dataset.
 */
export function prepareRegressionData(
  input: RegressionInput,
): { validRows: Row[]; excludedCount: number } | { error: RegressionError } {
  const { dataset, xCol, yCol } = input

  if (!dataset.columns.includes(xCol)) {
    return { error: { kind: 'missing_column', message: `Column "${xCol}" not found in dataset.` } }
  }
  if (!dataset.columns.includes(yCol)) {
    return { error: { kind: 'missing_column', message: `Column "${yCol}" not found in dataset.` } }
  }
  if (xCol === yCol) {
    return { error: { kind: 'same_column', message: 'X and Y must be different columns.' } }
  }

  const validRows = dataset.rows.filter((r) => {
    const xv = r[xCol]
    const yv = r[yCol]
    return (
      xv !== null && xv !== undefined && String(xv).trim() !== '' && isFinite(Number(xv)) &&
      yv !== null && yv !== undefined && String(yv).trim() !== '' && isFinite(Number(yv))
    )
  })

  const excludedCount = dataset.rows.length - validRows.length
  return { validRows, excludedCount }
}

/**
 * Run the full regression. Returns either a RegressionResult or a RegressionError.
 */
export function runLinearRegression(
  input: RegressionInput,
): RegressionResult | RegressionError {
  const prepared = prepareRegressionData(input)
  if ('error' in prepared) return prepared.error

  const { validRows, excludedCount } = prepared
  const { xCol, yCol } = input

  if (validRows.length < 3) {
    return {
      kind: 'insufficient_data',
      message: `At least 3 valid observations are required. Found ${validRows.length}.`,
    }
  }

  const xs = validRows.map((r) => Number(r[xCol]))
  const ys = validRows.map((r) => Number(r[yCol]))

  // Check if all X values are identical
  if (xs.every((v) => v === xs[0])) {
    return {
      kind: 'constant_x',
      message: 'All X values are identical — regression cannot be computed.',
    }
  }

  // Check if all Y values are identical (constant prediction; R² is N/A)
  const yIsConstant = ys.every((v) => v === ys[0])

  if (yIsConstant) {
    const intercept = ys[0]
    const equation = `ŷ = ${intercept.toFixed(4)}`
    return {
      slope: 0,
      intercept,
      rSquared: null,
      equation,
      validRows,
      excludedCount,
      xValues: xs,
      yValues: ys,
    }
  }

  const result = linearRegression(xs, ys)
  if (!result) {
    return {
      kind: 'constant_x',
      message: 'Unable to compute regression — check that X values vary.',
    }
  }

  const sign = result.intercept >= 0 ? '+' : '-'
  const equation = `ŷ = ${result.slope.toFixed(4)}x ${sign} ${Math.abs(result.intercept).toFixed(4)}`

  return {
    slope: result.slope,
    intercept: result.intercept,
    rSquared: result.rSquared,
    equation,
    validRows,
    excludedCount,
    xValues: xs,
    yValues: ys,
  }
}

/** Predict Y for a given X value using regression coefficients. */
export function predictY(slope: number, intercept: number, x: number): number {
  return slope * x + intercept
}
