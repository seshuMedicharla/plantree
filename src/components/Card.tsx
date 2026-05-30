import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export default function Card({ className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
