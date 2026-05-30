import type { HTMLAttributes } from 'react'

type PillProps = HTMLAttributes<HTMLSpanElement> & {
  text: string
}

export default function Pill({ text, className = '', ...props }: PillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ${className}`}
      {...props}
    >
      {text}
    </span>
  )
}
