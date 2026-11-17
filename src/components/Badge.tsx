type BadgeColor = 'blue' | 'yellow' | 'red' | 'green' | 'gray' | 'orange'

interface BadgeProps {
  color?: BadgeColor
  children: React.ReactNode
}

const colorClasses: Record<BadgeColor, string> = {
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
}

export function Badge({ color = 'gray', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses[color]}`}
    >
      {children}
    </span>
  )
}
