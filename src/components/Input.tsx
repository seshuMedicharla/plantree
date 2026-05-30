import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 ${className}`}
      {...props}
    />
  )
})

export default Input
