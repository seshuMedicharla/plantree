import PageScaffold from '../components/PageScaffold'

export default function HomePage() {
  return (
    <PageScaffold
      title="Home"
      subtitle="Track your progress and stay consistent with your plant care goals."
    >
      <div className="grid gap-3">
        <div className="rounded-2xl bg-emerald-600 p-4 text-white">
          <p className="text-xs uppercase tracking-wider text-emerald-100">Today</p>
          <p className="mt-1 text-2xl font-bold">3 Tasks Pending</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Next watering</p>
          <p className="mt-1 text-sm text-slate-500">Monstera in 2 hours</p>
        </div>
      </div>
    </PageScaffold>
  )
}
