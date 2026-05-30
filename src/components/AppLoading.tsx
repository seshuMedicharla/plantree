import PlanTreeLogo from './PlanTreeLogo'

type AppLoadingProps = {
  message?: string
}

export default function AppLoading({ message = 'Loading PlanTree...' }: AppLoadingProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-6">
      <PlanTreeLogo className="h-16 w-16 animate-pulse" />
      <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
      <div className="mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
      </div>
    </div>
  )
}
