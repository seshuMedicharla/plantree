import type { ReactNode } from 'react'

type PageScaffoldProps = {
  title: string
  subtitle: string
  children?: ReactNode
}

export default function PageScaffold({
  title,
  subtitle,
  children,
}: PageScaffoldProps) {
  return (
    <section className="px-4 py-6">
      <header className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
          Green Plant
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </header>
      {children ? (
        children
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Content section placeholder
        </div>
      )}
    </section>
  )
}
