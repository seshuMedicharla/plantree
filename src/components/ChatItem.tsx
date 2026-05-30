type ChatItemProps = {
  name: string
  message: string
  time: string
}

export default function ChatItem({ name, message, time }: ChatItemProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
          {name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">{message}</p>
        </div>
      </div>
      <p className="ml-3 text-[11px] font-medium text-slate-400">{time}</p>
    </div>
  )
}
