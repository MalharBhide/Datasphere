/**
 * ChartPreview.tsx
 *
 * React wrapper around Apache ECharts using echarts-for-react.
 * Renders a live chart from an EChartsOption.
 * Exposes the ECharts instance via forwardRef for export.
 */
import { forwardRef, useRef, useImperativeHandle, type Ref } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from '../lib/echartsBuilder'

export interface ChartPreviewHandle {
  getEchartsInstance: () => ReturnType<InstanceType<typeof ReactECharts>['getEchartsInstance']> | null
}

interface ChartPreviewProps {
  option: EChartsOption
  height?: number
  className?: string
}

export const ChartPreview = forwardRef<ChartPreviewHandle, ChartPreviewProps>(
  function ChartPreview({ option, height = 480, className }, ref: Ref<ChartPreviewHandle>) {
    const echartsRef = useRef<ReactECharts>(null)

    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => echartsRef.current?.getEchartsInstance() ?? null,
    }))

    return (
      <div
        className={className}
        style={{ width: '100%', height: `${height}px` }}
        role="img"
        aria-label="Chart visualization"
      >
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={false}
        />
      </div>
    )
  },
)
