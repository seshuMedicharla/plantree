import type { ToastState } from './useToast'

type ToastProps = {
  toast: ToastState | null
  onDismiss: () => void
}

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-slate-200 bg-slate-50 text-slate-800',
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null

  return (
    <div className="sticky top-16 z-40 px-4">
      <div
        className={`mx-auto flex w-full items-start justify-between gap-3 rounded-2xl border px-3 py-2 text-sm shadow-sm ${toneClasses[toast.type]}`}
      >
        <p className="leading-5">{toast.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-0.5 text-xs font-medium hover:bg-black/10"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
