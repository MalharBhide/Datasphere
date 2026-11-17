import { type ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section'
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className = '', as: Tag = 'div', padding = 'md' }: CardProps) {
  return (
    <Tag
      className={[
        'bg-white rounded-xl border border-[#E2E8F0]',
        'shadow-[0_0_0_1px_#E2E8F0,0_1px_3px_0_rgb(0_0_0/0.05)]',
        paddingClasses[padding],
        className,
      ].join(' ')}
    >
      {children}
    </Tag>
  )
}
