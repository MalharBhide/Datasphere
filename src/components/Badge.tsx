type BadgeVariant = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'orange' | 'violet' | 'teal'

interface BadgeProps {
  variant?: BadgeVariant
  /** @deprecated use variant instead of color */
  color?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  info:    'bg-[#EEF2FF] text-[#3B5BDB]',
  success: 'bg-[#E6FCF5] text-[#065F46]',
  warning: 'bg-[#FFF3CD] text-[#E67700]',
  danger:  'bg-[#FFE0E0] text-[#D63939]',
  neutral: 'bg-slate-100 text-[#475569]',
  orange:  'bg-orange-100 text-orange-700',
  violet:  'bg-violet-100 text-violet-700',
  teal:    'bg-teal-100 text-teal-700',
}

// Legacy color → variant mapping for backward compat
const colorMap: Record<string, BadgeVariant> = {
  blue:   'info',
  green:  'success',
  yellow: 'warning',
  red:    'danger',
  gray:   'neutral',
  orange: 'orange',
}

export function Badge({ variant, color, children }: BadgeProps) {
  const resolved: BadgeVariant = variant ?? (color ? (colorMap[color] ?? 'neutral') : 'neutral')
  return (
    <span
      className={[
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        variantClasses[resolved],
      ].join(' ')}
    >
      {children}
    </span>
  )
}
