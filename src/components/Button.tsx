import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: [
    'bg-[#3B5BDB] text-white',
    'hover:bg-[#2F4AC7]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  secondary: [
    'bg-white text-[#0F172A] border border-[#CBD5E1]',
    'hover:bg-slate-50',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#475569]',
    'hover:bg-slate-100 hover:text-[#0F172A]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-[#D63939] text-white',
    'hover:bg-[#C03030]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  success: [
    'bg-[#0CA678] text-white',
    'hover:bg-[#099268]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium',
        'transition-colors duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B5BDB] focus-visible:ring-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
